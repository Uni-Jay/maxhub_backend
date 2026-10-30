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

// Accepts either the uuid or the numeric id (the page has used both).
const byId = (id: string) => (/^\d+$/.test(String(id)) ? { id } : { uuid: id });

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

// ─── Folder upload (keeps the folder structure from the computer) ───────────

const cleanSegment = (s: string) => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 120);

// POST /api/files/folders/tree { parentId, paths: ["Clients", "Clients/2024", ...] }
// Creates any missing sub-folders under parentId (re-using ones that already
// exist with the same name) and returns { "Clients/2024": "<uuid>", ... }.
router.post('/folders/tree', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { parentId } = req.body;
  const paths: string[] = Array.isArray(req.body.paths) ? req.body.paths.slice(0, 5000) : [];
  if (!parentId) return ResponseFormatter.error(res, 'Open a folder first, then upload the folder into it', 400);
  const parent: any = await FileRecord.findOne({ where: { uuid: parentId, isFolder: true } });
  if (!parent) return ResponseFormatter.notFound(res, 'Folder not found');
  if (!(await isFolderAccessible(req, parentId, user))) return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
  if (parent.folderType === 'Personal' && String(parent.uploadedById) !== String(user?.id)) {
    return ResponseFormatter.forbidden(res, 'You cannot add folders to someone else\'s private folder', req.path);
  }
  const by = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email;
  const map: Record<string, string> = { '': parent.uuid };
  // Shortest paths first so every parent exists before its children.
  const all = new Set<string>();
  for (const p of paths) {
    const segs = String(p || '').split('/').map(cleanSegment).filter(Boolean);
    for (let i = 1; i <= segs.length; i++) all.add(segs.slice(0, i).join('/'));
  }
  const sorted = [...all].sort((a, b) => a.split('/').length - b.split('/').length);
  for (const p of sorted) {
    const segs = p.split('/');
    const name = segs[segs.length - 1];
    const parentUuid = map[segs.slice(0, -1).join('/')];
    let folder: any = await FileRecord.findOne({ where: { isFolder: true, folderId: parentUuid, name } });
    if (!folder) {
      folder = await FileRecord.create({
        uuid: uuidv4(), name, folderId: parentUuid, isFolder: true,
        folderType: parent.folderType || null, restrictedToRoles: parent.restrictedToRoles || null,
        icon: parent.folderType === 'Personal' ? '🔒' : '📁', size: 0, uploadedById: user?.id, uploadedByName: by,
      } as any);
    }
    map[p] = folder.uuid;
  }
  ResponseFormatter.success(res, map, `${sorted.length} folder(s) ready`);
}));

// ─── Folder download as a ZIP ───────────────────────────────────────────────

type ZipEntry = { name: string; path: string };
const zipLinks = new Map<string, { title: string; entries: ZipEntry[]; folders: string[]; expires: number }>();

// Everything inside a folder the caller can open, with paths relative to it.
async function collectFolder(req: Request, rootUuid: string) {
  const user = (req as any).user;
  const entries: ZipEntry[] = []; const folders: string[] = [];
  let totalSize = 0;
  const walk = async (uuid: string, prefix: string, depth: number) => {
    if (depth > 30) return;
    const kids: any[] = await FileRecord.findAll({ where: { folderId: uuid }, order: [['isFolder', 'DESC'], ['name', 'ASC']] });
    const used = new Set<string>();
    for (const k of kids) {
      let base = cleanSegment(k.name || k.originalName || 'file') || 'file';
      // Two files with the same name in one folder: add (2), (3)…
      if (used.has(base.toLowerCase())) { const ext = path.extname(base); const stem = base.slice(0, base.length - ext.length); let n = 2; while (used.has(`${stem} (${n})${ext}`.toLowerCase())) n++; base = `${stem} (${n})${ext}`; }
      used.add(base.toLowerCase());
      if (k.isFolder) {
        if (!(await isFolderAccessible(req, k.uuid, user))) continue;
        folders.push(prefix + base + '/');
        await walk(k.uuid, prefix + base + '/', depth + 1);
      } else if (k.path) {
        entries.push({ name: prefix + base, path: k.path });
        totalSize += Number(k.size) || 0;
      }
    }
  };
  await walk(rootUuid, '', 0);
  return { entries, folders, totalSize };
}

// POST /api/files/folders/:id/zip-link → a one-time link (valid 15 minutes)
// so the browser can download the ZIP directly, with its own progress bar.
router.post('/folders/:id/zip-link', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const folder: any = await FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
  if (!folder) return ResponseFormatter.notFound(res, 'Folder not found');
  if (!(await isFolderAccessible(req, folder.uuid, user))) return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
  const { entries, folders, totalSize } = await collectFolder(req, folder.uuid);
  if (!entries.length && !folders.length) return ResponseFormatter.error(res, 'This folder is empty', 400);
  const now = Date.now();
  for (const [k, v] of zipLinks) if (v.expires < now) zipLinks.delete(k);
  const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  zipLinks.set(token, { title: cleanSegment(folder.name) || 'Folder', entries, folders, expires: now + 15 * 60_000 });
  ResponseFormatter.success(res, { token, files: entries.length, folders: folders.length, totalSize });
}));

// GET /api/files/zip/:token — mounted before sign-in checks (the token is the permission).
export async function zipDownload(req: Request, res: Response) {
  const link = zipLinks.get(String(req.params.token));
  if (!link || link.expires < Date.now()) return res.status(410).send('This download link has expired. Go back to MaxHub and click Download folder again.');
  zipLinks.delete(String(req.params.token));
  const archiver = require('archiver');
  const zip = archiver('zip', { zlib: { level: 3 } });
  const failed: string[] = [];
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(link.title)}.zip"; filename*=UTF-8''${encodeURIComponent(link.title)}.zip`);
  zip.on('warning', () => undefined);
  zip.on('error', () => { try { res.end(); } catch { /* ignore */ } });
  zip.pipe(res);
  for (const f of link.folders) zip.append('', { name: f });
  const { Readable } = require('stream');
  for (const e of link.entries) {
    try {
      if (/^https?:\/\//i.test(e.path)) {
        const r = await fetch(e.path);
        if (!r.ok || !r.body) throw new Error(String(r.status));
        const done = new Promise((ok) => zip.once('entry', ok));
        zip.append(Readable.fromWeb(r.body as any), { name: e.name });
        await done; // one file at a time keeps memory low
      } else {
        const local = path.join(process.cwd(), e.path.replace(/^\//, ''));
        if (!fs.existsSync(local)) throw new Error('missing');
        const done = new Promise((ok) => zip.once('entry', ok));
        zip.file(local, { name: e.name });
        await done;
      }
    } catch { failed.push(e.name); }
  }
  if (failed.length) zip.append(`These files could not be fetched and are not in this ZIP:\n\n${failed.join('\n')}\n`, { name: '_MISSING FILES.txt' });
  await zip.finalize();
}

// GET /api/files/fetch?url=… — the server fetches a stored file and sends it
// back as a download, for when the browser can't fetch it directly. Only our
// own storage (Cloudinary, this server's /uploads) is allowed — never any other site.
router.get('/fetch', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const raw = String(req.query.url || '');
  let u: URL;
  try { u = new URL(raw); } catch { return ResponseFormatter.error(res, 'Invalid file link', 400); }
  const own = process.env.BACKEND_PUBLIC_URL ? new URL(process.env.BACKEND_PUBLIC_URL).host : '';
  const isOwn = !!own && u.host === own && u.pathname.startsWith('/uploads/');
  if (!(isOwn || (u.protocol === 'https:' && u.hostname === 'res.cloudinary.com'))) {
    return ResponseFormatter.forbidden(res, 'That link is not a MaxHub file', req.path);
  }
  if (isOwn) {
    const base = path.join(process.cwd(), 'uploads');
    const local = path.join(process.cwd(), decodeURIComponent(u.pathname).replace(/^\//, ''));
    if (!local.startsWith(base + path.sep) || !fs.existsSync(local)) return ResponseFormatter.notFound(res, 'File not found');
    return (res as any).download(local, path.basename(local));
  }
  const r = await fetch(u.toString());
  if (!r.ok || !r.body) return ResponseFormatter.error(res, `The file could not be fetched (${r.status})`, 502);
  const name = decodeURIComponent(u.pathname.split('/').pop() || 'download');
  res.setHeader('Content-Type', r.headers.get('content-type') || 'application/octet-stream');
  const len = r.headers.get('content-length'); if (len) res.setHeader('Content-Length', len);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`);
  const { Readable } = require('stream');
  Readable.fromWeb(r.body as any).pipe(res);
}));

// ─── Client folders: <Brand folder> / <Client name> ─────────────────────────
// Documents uploaded on a client's record are filed here automatically.
const BRAND_FOLDERS: Record<string, string> = { VM: 'VisaMax', VMX: 'VisaMax', KS: 'Kurios SAT', BM: 'BeadMax', MF: 'Maxfood Farm' };
function brandFolderName(code: any): string | null {
  const c = String(code || '').toUpperCase().split('-')[0];
  // A client not tied to a brand is filed under the shared "Shared" folder.
  return BRAND_FOLDERS[c] || 'Shared';
}
async function clientFolder(req: Request, brand: any, client: any, create: boolean) {
  const brandName = brandFolderName(brand);
  const name = cleanSegment(String(client || '')).replace(/\s+/g, ' ');
  if (!brandName || !name) return { error: !brandName ? 'Unknown brand' : 'The client has no name yet' };
  await ensureFolders(req);
  const top: any = await FileRecord.findOne({ where: { isFolder: true, folderId: null, name: brandName } });
  if (!top) return { error: 'Brand folder not found' };
  let folder: any = await FileRecord.findOne({ where: { isFolder: true, folderId: top.uuid, name: { [Op.iLike]: name } } });
  if (!folder && create) {
    const user = (req as any).user;
    folder = await FileRecord.create({
      uuid: uuidv4(), name, folderId: top.uuid, isFolder: true, folderType: null, restrictedToRoles: top.restrictedToRoles || null,
      icon: '📁', size: 0, uploadedById: user?.id,
      uploadedByName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    } as any);
  }
  return { brandFolder: top, folder };
}

// GET /api/files/client-folder?brand=VM&client=Ada%20Obi → the folder (if made yet) and its files
router.get('/client-folder', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const r: any = await clientFolder(req, req.query.brand, req.query.client, false);
  if (r.error) return ResponseFormatter.error(res, r.error, 400);
  const files = r.folder ? await FileRecord.findAll({ where: { folderId: r.folder.uuid, isFolder: false }, order: [['createdAt', 'DESC']] }) : [];
  ResponseFormatter.success(res, { folder: r.folder ? { uuid: r.folder.uuid, name: r.folder.name, path: `${r.brandFolder.name} › ${r.folder.name}` } : null, path: `${r.brandFolder.name} › ${cleanSegment(String(req.query.client || ''))}`, files: files.map(withUrl) });
}));

// POST /api/files/client-folder { brand, client } → creates the folder if needed
router.post('/client-folder', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const r: any = await clientFolder(req, req.body.brand, req.body.client, true);
  if (r.error) return ResponseFormatter.error(res, r.error, 400);
  ResponseFormatter.success(res, { uuid: r.folder.uuid, name: r.folder.name, path: `${r.brandFolder.name} › ${r.folder.name}` });
}));

// POST /api/files/client-folder/attach { brand, client, fileId } → puts a file that is
// already in MaxHub Files into the client's folder too (same file, no re-upload).
router.post('/client-folder/attach', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const src: any = await FileRecord.findOne({ where: { ...byId(req.body.fileId), isFolder: false } });
  if (!src) return ResponseFormatter.notFound(res, 'File not found');
  if (!(await isFolderAccessible(req, src.folderId, user))) return ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
  const r: any = await clientFolder(req, req.body.brand, req.body.client, true);
  if (r.error) return ResponseFormatter.error(res, r.error, 400);
  let copy: any = src.folderId === r.folder.uuid ? src : await FileRecord.findOne({ where: { folderId: r.folder.uuid, path: src.path, isFolder: false } });
  if (!copy) {
    copy = await FileRecord.create({
      uuid: uuidv4(), name: src.name, originalName: src.originalName, path: src.path, mimeType: src.mimeType, size: src.size,
      folderId: r.folder.uuid, isFolder: false, uploadedById: user?.id,
      uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    } as any);
  }
  ResponseFormatter.success(res, withUrl(copy), `Filed in ${r.brandFolder.name} › ${r.folder.name}`);
}));

// GET /api/files
router.get('/',ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { folderId, search } = req.query;
  const { general, mine, named } = await ensureFolders(req);

  const where: any = { isFolder: false };
  if (folderId) {
    if (!(await isFolderAccessible(req, folderId as string, user))) {
      return ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
    }
    where.folderId = folderId as string;
  } else if (search && req.query.everywhere === '1') {
    // Search every folder this person can open (used by "Add from MaxHub Files").
    where.name = { [Op.iLike]: `%${search}%` };
    const hits: any[] = await FileRecord.findAll({ where, order: [['createdAt', 'DESC']], limit: 200 });
    const ok = new Map<string, boolean>();
    const visible: any[] = [];
    for (const h of hits) {
      const key = String(h.folderId || '');
      if (!ok.has(key)) ok.set(key, await isFolderAccessible(req, h.folderId, user));
      if (ok.get(key)) visible.push(h);
      if (visible.length >= 60) break;
    }
    return ResponseFormatter.success(res, visible.map(withUrl));
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
  const file = await FileRecord.findOne({ where: { ...byId(req.params.id), isFolder: false } });
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
  const file = await FileRecord.findOne({ where: byId(req.params.id) });
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

// PATCH /api/files/:id/rename (and PATCH /api/files/:id, which the page uses)
const renameHandler = ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name } = req.body;
  if (!name) return ResponseFormatter.error(res, 'New name is required', 400);

  const file = await FileRecord.findOne({ where: byId(req.params.id) });
  if (!file) return ResponseFormatter.notFound(res, 'File not found');

  if (!file.isFolder && !(await isFolderAccessible(req, file.folderId, user))) {
    return ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
  }
  if (file.isFolder ? (isSystemFolder(file) || !canChangeFolder(req, file)) : !canChangeFolder(req, file)) {
    return ResponseFormatter.forbidden(res, 'Only the owner (or an Admin) can rename this', req.path);
  }

  await file.update({ name: String(name).trim().slice(0, 255) });
  ResponseFormatter.success(res, withUrl(file), 'File renamed');
});
router.patch('/:id/rename', renameHandler);
router.patch('/:id', renameHandler);

// POST /api/files/:id/share
router.post('/:id/share', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { emails } = req.body;
  ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));

export default router;
