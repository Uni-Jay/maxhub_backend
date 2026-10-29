// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { FileRecord } from '@models/FileRecord.model';
import { upload, getFileUrl } from '@config/multer';
import { getRoleBucket } from '@utils/RoleBucket';

const router = Router();

// Files uploaded via Cloudinary already have an absolute, permanent URL
// stored in `path` (e.g. https://res.cloudinary.com/...). Older files
// uploaded before that switch have a backend-relative path like
// /uploads/xyz.png — those only resolve correctly against the backend's
// own origin, which the frontend (a different domain in production) can't
// guess on its own. The frontend's FileItem type reads `url`, not `path`,
// so every file needs this added before being sent back.
function withUrl(file: any) {
  const json = typeof file?.toJSON === 'function' ? file.toJSON() : file;
  if (!json.path) return { ...json, url: null };
  const url = /^https?:\/\//i.test(json.path)
    ? json.path
    : `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000'}${json.path}`;
  return { ...json, url };
}

// Named, shared folders beyond the personal/general pair — some restricted to
// HR-domain roles. Lazily ensured (findOrCreate) so re-running this never duplicates them.
const NAMED_FOLDERS: { name: string; icon: string; restrictedToRoles?: string[] }[] = [
  { name: 'Pictures', icon: '🖼️' },
  { name: 'VisaMax', icon: '✈️' },
  { name: 'Kurios SAT', icon: '💻' },
  { name: 'BeadMax', icon: '📿' },
  { name: 'Maxfood Farm', icon: '🌾' },
  { name: 'Projects', icon: '📁' },
  { name: 'Certificates', icon: '🎓' },
  { name: 'Shared', icon: '📁' },
  { name: 'Company Documents', icon: '🏢', restrictedToRoles: ['admin', 'hr', 'superadmin'] },
  { name: 'HR Documents', icon: '🗂️', restrictedToRoles: ['admin', 'hr', 'superadmin'] },
];

function isBypassRole(req: Request): boolean {
  const bucket = getRoleBucket(req);
  return bucket === 'superadmin' || bucket === 'admin';
}

function canSeeNamedFolder(req: Request, folder: any): boolean {
  if (!folder.restrictedToRoles) return true;
  if (isBypassRole(req)) return true;
  try {
    const allowed: string[] = JSON.parse(folder.restrictedToRoles);
    return allowed.includes(getRoleBucket(req));
  } catch {
    return true;
  }
}

// Ensures (and lazily creates) the shared General Folder, the caller's own
// private My Folder, and the fixed set of named shared folders.
async function ensureFolders(req: Request) {
  const user = (req as any).user;
  const [general] = await FileRecord.findOrCreate({
    where: { isFolder: true, folderType: 'General', folderId: null },
    defaults: {
      uuid: uuidv4(), name: 'General Folder', isFolder: true, folderType: 'General', icon: '📁', size: 0,
    } as any,
  });
  const [mine] = await FileRecord.findOrCreate({
    where: { isFolder: true, folderType: 'Personal', uploadedById: user?.id, folderId: null },
    defaults: {
      uuid: uuidv4(), name: 'My Folder', isFolder: true, folderType: 'Personal', icon: '🔒', size: 0,
      uploadedById: user?.id,
      uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    } as any,
  });

  const named = [];
  for (const def of NAMED_FOLDERS) {
    // name + isFolder is already unique among these rows — no other folder shares these names.
    const [folder] = await FileRecord.findOrCreate({
      where: { isFolder: true, name: def.name, folderId: null },
      defaults: {
        uuid: uuidv4(), name: def.name, isFolder: true, icon: def.icon, size: 0,
        restrictedToRoles: def.restrictedToRoles ? JSON.stringify(def.restrictedToRoles) : undefined,
      } as any,
    });
    named.push(folder);
  }

  return { general, mine, named: named.filter((f) => canSeeNamedFolder(req, f)) };
}

// A folder is accessible unless it's someone else's Personal folder (strictly
// private, no role exception) or a named folder restricted to other roles.
async function isFolderAccessible(req: Request, folderUuid: string | undefined, user: any): Promise<boolean> {
  if (!folderUuid) return true;
  const folder = await FileRecord.findOne({ where: { uuid: folderUuid, isFolder: true } });
  if (!folder) return true;
  if (folder.folderType === 'Personal' && String(folder.uploadedById) !== String(user?.id)) return false;
  if (!folder.folderType && !canSeeNamedFolder(req, folder)) return false;
  return true;
}

// GET /api/files/folders
router.get('/folders', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { general, mine, named } = await ensureFolders(req);
  // ?parentId=<uuid> lists the sub-folders inside a folder the caller can open.
  if (req.query.parentId) {
    const parentId = String(req.query.parentId);
    if (!(await isFolderAccessible(req, parentId, user))) {
      return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
    }
    const children = await FileRecord.findAll({ where: { isFolder: true, folderId: parentId }, order: [['name', 'ASC']] });
    const visible = [];
    for (const c of children) if (await isFolderAccessible(req, (c as any).uuid, user)) visible.push(c);
    return ResponseFormatter.success(res, visible);
  }
  ResponseFormatter.success(res, [mine, general, ...named]);
}));

const SYSTEM_FOLDER_NAMES = new Set(NAMED_FOLDERS.map((f) => f.name));
function isSystemFolder(folder: any): boolean {
  return !folder.folderId && (folder.folderType === 'General' || folder.folderType === 'Personal' || SYSTEM_FOLDER_NAMES.has(folder.name));
}
function canChangeFolder(req: Request, folder: any): boolean {
  if (isBypassRole(req)) return true;
  return String(folder.uploadedById) === String((req as any).user?.id);
}

// POST /api/files/folders — sub-folders inherit privacy from their parent:
// inside "My Folder" they are private to the owner; inside "General Folder"
// or another shared folder they are public to all staff. Top-level folders
// remain Super Admin only.
router.post('/folders', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const roles = (user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  const { name, parentId } = req.body;
  const clean = String(name || '').trim().slice(0, 120);
  if (!clean) return ResponseFormatter.error(res, 'Folder name is required', 400);

  let folderType: any = null;
  let restrictedToRoles: any = null;
  if (parentId) {
    const parent: any = await FileRecord.findOne({ where: { uuid: parentId, isFolder: true } });
    if (!parent) return ResponseFormatter.notFound(res, 'Parent folder not found');
    if (!(await isFolderAccessible(req, parentId, user))) return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
    folderType = parent.folderType || null; // Personal → private, General → public
    restrictedToRoles = parent.restrictedToRoles || null;
    if (folderType === 'Personal' && String(parent.uploadedById) !== String(user?.id)) {
      return ResponseFormatter.forbidden(res, 'You cannot add folders to someone else\'s private folder', req.path);
    }
  } else if (!roles.includes('superadmin')) {
    return ResponseFormatter.forbidden(res, 'Only Super Admin can create top-level folders — open My Folder (private) or General Folder (public) and create it there', req.path);
  }

  const folder = await FileRecord.create({
    uuid: uuidv4(),
    name: clean,
    folderId: parentId || null,
    isFolder: true,
    folderType,
    restrictedToRoles,
    icon: folderType === 'Personal' ? '🔒' : '📁',
    size: 0,
    uploadedById: user?.id,
    uploadedByName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
  } as any);

  ResponseFormatter.success(res, folder, 'Folder created', 201);
}));

// PATCH /api/files/folders/:id/rename — owner or Admin; system folders are fixed.
router.patch('/folders/:id/rename', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return ResponseFormatter.error(res, 'New name is required', 400);

  const folder: any = await FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
  if (!folder) return ResponseFormatter.notFound(res, 'Folder not found');
  if (isSystemFolder(folder)) return ResponseFormatter.forbidden(res, 'This folder cannot be renamed', req.path);
  if (!canChangeFolder(req, folder)) return ResponseFormatter.forbidden(res, 'Only the folder owner or an Admin can rename it', req.path);

  await folder.update({ name: String(name).trim().slice(0, 120) });
  ResponseFormatter.success(res, folder, 'Folder renamed');
}));

// DELETE /api/files/folders/:id — owner or Admin; system folders are fixed.
router.delete('/folders/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const folder: any = await FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
  if (!folder) return ResponseFormatter.notFound(res, 'Folder not found');
  if (isSystemFolder(folder)) return ResponseFormatter.forbidden(res, 'This folder cannot be deleted', req.path);
  if (!canChangeFolder(req, folder)) return ResponseFormatter.forbidden(res, 'Only the folder owner or an Admin can delete it', req.path);
  const inside = await FileRecord.count({ where: { folderId: folder.uuid } });
  if (inside > 0) return ResponseFormatter.error(res, 'Empty the folder before deleting it', 400);
  await folder.destroy();
  ResponseFormatter.success(res, null, 'Folder deleted');
}));

// GET /api/files
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { folderId, search } = req.query;
  const { general, mine, named } = await ensureFolders(req);

  const where: any = { isFolder: false };
  if (folderId) {
    if (!(await isFolderAccessible(req, folderId as string, user))) {
      return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
    }
    where.folderId = folderId as string;
  } else {
    where.folderId = { [Op.in]: [general.uuid, mine.uuid, ...named.map((f: any) => f.uuid)] };
  }
  if (search) where.name = { [Op.iLike]: `%${search}%` };

  const files = await FileRecord.findAll({ where, order: [['createdAt', 'DESC']] });
  ResponseFormatter.success(res, files.map(withUrl));
}));

// POST /api/files/upload — accepts a pre-hosted URL (Cloudinary, uploaded
// directly from the browser), a multipart file (legacy local-disk path), or
// a base64 body (legacy fallback) — in that priority order.
router.post('/upload', upload.single('file'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { folderId } = req.body;

  if (!(await isFolderAccessible(req, folderId, user))) {
    return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
  }

  // Preferred path: frontend already uploaded directly to Cloudinary (same
  // as chat attachments and staff documents) and just needs a FileRecord
  // pointing at the resulting permanent URL — no disk write, no size limit
  // beyond Cloudinary's own.
  const { url, name: directName, mimeType: directMimeType, size: directSize } = req.body;
  if (url) {
    const record = await FileRecord.create({
      uuid: uuidv4(),
      name: directName || url.split('/').pop(),
      originalName: directName || url.split('/').pop(),
      path: url,
      mimeType: directMimeType || 'application/octet-stream',
      size: Number(directSize) || 0,
      folderId: folderId || null,
      isFolder: false,
      uploadedById: user?.id,
      uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    } as any);
    return ResponseFormatter.success(res, withUrl(record), 'File uploaded', 201);
  }

  if (req.file) {
    const record = await FileRecord.create({
      uuid: uuidv4(),
      name: req.file.originalname,
      originalName: req.file.originalname,
      path: getFileUrl(req.file.filename),
      mimeType: req.file.mimetype,
      size: req.file.size,
      folderId: folderId || null,
      isFolder: false,
      uploadedById: user?.id,
      uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    } as any);
    return ResponseFormatter.success(res, withUrl(record), 'File uploaded', 201);
  }

  // Fallback: base64 upload
  const { name, base64Content, mimeType } = req.body;
  if (!name) return ResponseFormatter.error(res, 'File name or multipart file required', 400);

  let filePath: string | null = null;
  let size = 0;

  if (base64Content) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(name) || '';
    const filename = `${uuidv4()}${ext}`;
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    filePath = getFileUrl(filename);
    size = buffer.length;
  }

  const record = await FileRecord.create({
    uuid: uuidv4(),
    name,
    originalName: name,
    path: filePath,
    mimeType: mimeType || 'application/octet-stream',
    size,
    folderId: folderId || null,
    isFolder: false,
    uploadedById: user?.id,
    uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
  } as any);

  ResponseFormatter.success(res, withUrl(record), 'File uploaded', 201);
}));

// GET /api/files/:id/download
router.get('/:id/download', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const file = await FileRecord.findOne({ where: { uuid: req.params.id, isFolder: false } });
  if (!file) return ResponseFormatter.notFound(res, 'File not found');

  if (!(await isFolderAccessible(req, file.folderId, user))) {
    return ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
  }

  if (file.path && /^https?:\/\//i.test(file.path)) {
    return res.redirect(file.path);
  }

  if (file.path) {
    const localPath = path.join(process.cwd(), file.path.replace(/^\//, ''));
    if (fs.existsSync(localPath)) {
      return (res as any).download(localPath, file.originalName || file.name);
    }
  }

  ResponseFormatter.error(res, 'File content not available on disk', 404);
}));

// DELETE /api/files/:id
router.delete('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const file = await FileRecord.findOne({ where: { uuid: req.params.id } });
  if (!file) return ResponseFormatter.notFound(res, 'File not found');

  if (!file.isFolder && !(await isFolderAccessible(req, file.folderId, user))) {
    return ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
  }
  // In shared (public) folders only the uploader or an Admin may delete a file.
  if (file.isFolder ? (isSystemFolder(file) || !canChangeFolder(req, file)) : !canChangeFolder(req, file)) {
    return ResponseFormatter.forbidden(res, 'Only the person who uploaded this (or an Admin) can delete it', req.path);
  }

  if (!file.isFolder && file.path) {
    const localPath = path.join(process.cwd(), file.path.replace(/^\//, ''));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }

  await file.destroy();
  ResponseFormatter.success(res, null, 'File deleted');
}));

// PATCH /api/files/:id/rename
router.patch('/:id/rename', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name } = req.body;
  if (!name) return ResponseFormatter.error(res, 'New name is required', 400);

  const file = await FileRecord.findOne({ where: { uuid: req.params.id } });
  if (!file) return ResponseFormatter.notFound(res, 'File not found');

  if (!file.isFolder && !(await isFolderAccessible(req, file.folderId, user))) {
    return ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
  }
  if (file.isFolder ? (isSystemFolder(file) || !canChangeFolder(req, file)) : !canChangeFolder(req, file)) {
    return ResponseFormatter.forbidden(res, 'Only the owner (or an Admin) can rename this', req.path);
  }

  await file.update({ name });
  ResponseFormatter.success(res, withUrl(file), 'File renamed');
}));

// POST /api/files/:id/share
router.post('/:id/share', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { emails } = req.body;
  ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));

export default router;
