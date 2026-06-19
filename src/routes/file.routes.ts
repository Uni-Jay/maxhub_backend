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

// Named, shared folders beyond the personal/general pair — some restricted to
// HR-domain roles. Lazily ensured (findOrCreate) so re-running this never duplicates them.
const NAMED_FOLDERS: { name: string; icon: string; restrictedToRoles?: string[] }[] = [
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
    where: { isFolder: true, folderType: 'General' },
    defaults: {
      uuid: uuidv4(), name: 'General Folder', isFolder: true, folderType: 'General', icon: '📁', size: 0,
    } as any,
  });
  const [mine] = await FileRecord.findOrCreate({
    where: { isFolder: true, folderType: 'Personal', uploadedById: user?.id },
    defaults: {
      uuid: uuidv4(), name: 'My Folder', isFolder: true, folderType: 'Personal', icon: '🔒', size: 0,
      uploadedById: user?.id,
      uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    } as any,
  });

  const named = [];
  for (const def of NAMED_FOLDERS) {
    const [folder] = await FileRecord.findOrCreate({
      where: { isFolder: true, name: def.name, folderType: { [Op.is]: null } },
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
  const { general, mine, named } = await ensureFolders(req);
  ResponseFormatter.success(res, [mine, general, ...named]);
}));

// POST /api/files/folders — Super Admin only; ad-hoc folders beyond the fixed
// My Folder/General/NAMED_FOLDERS set are not exposed in the UI.
router.post('/folders', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const roles = (user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  if (!roles.includes('superadmin')) {
    return ResponseFormatter.forbidden(res, 'Only Super Admin can create additional folders', req.path);
  }

  const { name, parentId } = req.body;
  if (!name) return ResponseFormatter.error(res, 'Folder name is required', 400);

  const folder = await FileRecord.create({
    uuid: uuidv4(),
    name,
    folderId: parentId || null,
    isFolder: true,
    icon: '📁',
    size: 0,
    uploadedById: user?.id,
    uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
  } as any);

  ResponseFormatter.success(res, folder, 'Folder created', 201);
}));

// PATCH /api/files/folders/:id/rename
router.patch('/folders/:id/rename', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return ResponseFormatter.error(res, 'New name is required', 400);

  const folder = await FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
  if (!folder) return ResponseFormatter.notFound(res, 'Folder not found');

  await folder.update({ name });
  ResponseFormatter.success(res, folder, 'Folder renamed');
}));

// DELETE /api/files/folders/:id
router.delete('/folders/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const folder = await FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
  if (!folder) return ResponseFormatter.notFound(res, 'Folder not found');
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
  ResponseFormatter.success(res, files);
}));

// POST /api/files/upload — multipart disk upload
router.post('/upload', upload.single('file'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { folderId } = req.body;

  if (!(await isFolderAccessible(req, folderId, user))) {
    return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
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
    return ResponseFormatter.success(res, record, 'File uploaded', 201);
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

  ResponseFormatter.success(res, record, 'File uploaded', 201);
}));

// GET /api/files/:id/download
router.get('/:id/download', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const file = await FileRecord.findOne({ where: { uuid: req.params.id, isFolder: false } });
  if (!file) return ResponseFormatter.notFound(res, 'File not found');

  if (!(await isFolderAccessible(req, file.folderId, user))) {
    return ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
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

  await file.update({ name });
  ResponseFormatter.success(res, file, 'File renamed');
}));

// POST /api/files/:id/share
router.post('/:id/share', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { emails } = req.body;
  ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));

export default router;
