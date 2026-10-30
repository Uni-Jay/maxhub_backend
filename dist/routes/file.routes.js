"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zipDownload = zipDownload;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const FileRecord_model_1 = require("../models/FileRecord.model");
const multer_1 = require("../config/multer");
const RoleBucket_1 = require("../utils/RoleBucket");
const router = (0, express_1.Router)();
const byId = (id) => (/^\d+$/.test(String(id)) ? { id } : { uuid: id });
function withUrl(file) {
    const json = typeof file?.toJSON === 'function' ? file.toJSON() : file;
    if (!json.path)
        return { ...json, url: null };
    const url = /^https?:\/\//i.test(json.path)
        ? json.path
        : `${process.env.BACKEND_PUBLIC_URL || 'http://localhost:3000'}${json.path}`;
    return { ...json, url };
}
const NAMED_FOLDERS = [
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
function isBypassRole(req) {
    const bucket = (0, RoleBucket_1.getRoleBucket)(req);
    return bucket === 'superadmin' || bucket === 'admin';
}
function canSeeNamedFolder(req, folder) {
    if (!folder.restrictedToRoles)
        return true;
    if (isBypassRole(req))
        return true;
    try {
        const allowed = JSON.parse(folder.restrictedToRoles);
        return allowed.includes((0, RoleBucket_1.getRoleBucket)(req));
    }
    catch {
        return true;
    }
}
async function ensureFolders(req) {
    const user = req.user;
    const [general] = await FileRecord_model_1.FileRecord.findOrCreate({
        where: { isFolder: true, folderType: 'General', folderId: null },
        defaults: {
            uuid: (0, uuid_1.v4)(), name: 'General Folder', isFolder: true, folderType: 'General', icon: '📁', size: 0,
        },
    });
    const [mine] = await FileRecord_model_1.FileRecord.findOrCreate({
        where: { isFolder: true, folderType: 'Personal', uploadedById: user?.id, folderId: null },
        defaults: {
            uuid: (0, uuid_1.v4)(), name: 'My Folder', isFolder: true, folderType: 'Personal', icon: '🔒', size: 0,
            uploadedById: user?.id,
            uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
        },
    });
    const named = [];
    for (const def of NAMED_FOLDERS) {
        const [folder] = await FileRecord_model_1.FileRecord.findOrCreate({
            where: { isFolder: true, name: def.name, folderId: null },
            defaults: {
                uuid: (0, uuid_1.v4)(), name: def.name, isFolder: true, icon: def.icon, size: 0,
                restrictedToRoles: def.restrictedToRoles ? JSON.stringify(def.restrictedToRoles) : undefined,
            },
        });
        named.push(folder);
    }
    return { general, mine, named: named.filter((f) => canSeeNamedFolder(req, f)) };
}
async function isFolderAccessible(req, folderUuid, user) {
    if (!folderUuid)
        return true;
    const folder = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: folderUuid, isFolder: true } });
    if (!folder)
        return true;
    if (folder.folderType === 'Personal' && String(folder.uploadedById) !== String(user?.id))
        return false;
    if (!folder.folderType && !canSeeNamedFolder(req, folder))
        return false;
    return true;
}
router.get('/folders', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { general, mine, named } = await ensureFolders(req);
    if (req.query.parentId) {
        const parentId = String(req.query.parentId);
        if (!(await isFolderAccessible(req, parentId, user))) {
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
        }
        const children = await FileRecord_model_1.FileRecord.findAll({ where: { isFolder: true, folderId: parentId }, order: [['name', 'ASC']] });
        const visible = [];
        for (const c of children)
            if (await isFolderAccessible(req, c.uuid, user))
                visible.push(c);
        return ResponseFormatter_1.ResponseFormatter.success(res, visible);
    }
    ResponseFormatter_1.ResponseFormatter.success(res, [mine, general, ...named]);
}));
const SYSTEM_FOLDER_NAMES = new Set(NAMED_FOLDERS.map((f) => f.name));
function isSystemFolder(folder) {
    return !folder.folderId && (folder.folderType === 'General' || folder.folderType === 'Personal' || SYSTEM_FOLDER_NAMES.has(folder.name));
}
function canChangeFolder(req, folder) {
    if (isBypassRole(req))
        return true;
    return String(folder.uploadedById) === String(req.user?.id);
}
router.post('/folders', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const roles = (user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    const { name, parentId } = req.body;
    const clean = String(name || '').trim().slice(0, 120);
    if (!clean)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Folder name is required', 400);
    let folderType = null;
    let restrictedToRoles = null;
    if (parentId) {
        const parent = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: parentId, isFolder: true } });
        if (!parent)
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Parent folder not found');
        if (!(await isFolderAccessible(req, parentId, user)))
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
        folderType = parent.folderType || null;
        restrictedToRoles = parent.restrictedToRoles || null;
        if (folderType === 'Personal' && String(parent.uploadedById) !== String(user?.id)) {
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You cannot add folders to someone else\'s private folder', req.path);
        }
    }
    else if (!roles.includes('superadmin')) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only Super Admin can create top-level folders — open My Folder (private) or General Folder (public) and create it there', req.path);
    }
    const folder = await FileRecord_model_1.FileRecord.create({
        uuid: (0, uuid_1.v4)(),
        name: clean,
        folderId: parentId || null,
        isFolder: true,
        folderType,
        restrictedToRoles,
        icon: folderType === 'Personal' ? '🔒' : '📁',
        size: 0,
        uploadedById: user?.id,
        uploadedByName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, folder, 'Folder created', 201);
}));
router.patch('/folders/:id/rename', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'New name is required', 400);
    const folder = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
    if (!folder)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Folder not found');
    if (isSystemFolder(folder))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'This folder cannot be renamed', req.path);
    if (!canChangeFolder(req, folder))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only the folder owner or an Admin can rename it', req.path);
    await folder.update({ name: String(name).trim().slice(0, 120) });
    ResponseFormatter_1.ResponseFormatter.success(res, folder, 'Folder renamed');
}));
router.delete('/folders/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const folder = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
    if (!folder)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Folder not found');
    if (isSystemFolder(folder))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'This folder cannot be deleted', req.path);
    if (!canChangeFolder(req, folder))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only the folder owner or an Admin can delete it', req.path);
    const inside = await FileRecord_model_1.FileRecord.count({ where: { folderId: folder.uuid } });
    if (inside > 0)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Empty the folder before deleting it', 400);
    await folder.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Folder deleted');
}));
const cleanSegment = (s) => String(s || '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().slice(0, 120);
router.post('/folders/tree', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { parentId } = req.body;
    const paths = Array.isArray(req.body.paths) ? req.body.paths.slice(0, 5000) : [];
    if (!parentId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Open a folder first, then upload the folder into it', 400);
    const parent = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: parentId, isFolder: true } });
    if (!parent)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Folder not found');
    if (!(await isFolderAccessible(req, parentId, user)))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
    if (parent.folderType === 'Personal' && String(parent.uploadedById) !== String(user?.id)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You cannot add folders to someone else\'s private folder', req.path);
    }
    const by = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email;
    const map = { '': parent.uuid };
    const all = new Set();
    for (const p of paths) {
        const segs = String(p || '').split('/').map(cleanSegment).filter(Boolean);
        for (let i = 1; i <= segs.length; i++)
            all.add(segs.slice(0, i).join('/'));
    }
    const sorted = [...all].sort((a, b) => a.split('/').length - b.split('/').length);
    for (const p of sorted) {
        const segs = p.split('/');
        const name = segs[segs.length - 1];
        const parentUuid = map[segs.slice(0, -1).join('/')];
        let folder = await FileRecord_model_1.FileRecord.findOne({ where: { isFolder: true, folderId: parentUuid, name } });
        if (!folder) {
            folder = await FileRecord_model_1.FileRecord.create({
                uuid: (0, uuid_1.v4)(), name, folderId: parentUuid, isFolder: true,
                folderType: parent.folderType || null, restrictedToRoles: parent.restrictedToRoles || null,
                icon: parent.folderType === 'Personal' ? '🔒' : '📁', size: 0, uploadedById: user?.id, uploadedByName: by,
            });
        }
        map[p] = folder.uuid;
    }
    ResponseFormatter_1.ResponseFormatter.success(res, map, `${sorted.length} folder(s) ready`);
}));
const zipLinks = new Map();
async function collectFolder(req, rootUuid) {
    const user = req.user;
    const entries = [];
    const folders = [];
    let totalSize = 0;
    const walk = async (uuid, prefix, depth) => {
        if (depth > 30)
            return;
        const kids = await FileRecord_model_1.FileRecord.findAll({ where: { folderId: uuid }, order: [['isFolder', 'DESC'], ['name', 'ASC']] });
        const used = new Set();
        for (const k of kids) {
            let base = cleanSegment(k.name || k.originalName || 'file') || 'file';
            if (used.has(base.toLowerCase())) {
                const ext = path_1.default.extname(base);
                const stem = base.slice(0, base.length - ext.length);
                let n = 2;
                while (used.has(`${stem} (${n})${ext}`.toLowerCase()))
                    n++;
                base = `${stem} (${n})${ext}`;
            }
            used.add(base.toLowerCase());
            if (k.isFolder) {
                if (!(await isFolderAccessible(req, k.uuid, user)))
                    continue;
                folders.push(prefix + base + '/');
                await walk(k.uuid, prefix + base + '/', depth + 1);
            }
            else if (k.path) {
                entries.push({ name: prefix + base, path: k.path });
                totalSize += Number(k.size) || 0;
            }
        }
    };
    await walk(rootUuid, '', 0);
    return { entries, folders, totalSize };
}
router.post('/folders/:id/zip-link', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const folder = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
    if (!folder)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Folder not found');
    if (!(await isFolderAccessible(req, folder.uuid, user)))
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
    const { entries, folders, totalSize } = await collectFolder(req, folder.uuid);
    if (!entries.length && !folders.length)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'This folder is empty', 400);
    const now = Date.now();
    for (const [k, v] of zipLinks)
        if (v.expires < now)
            zipLinks.delete(k);
    const token = (0, uuid_1.v4)().replace(/-/g, '') + (0, uuid_1.v4)().replace(/-/g, '');
    zipLinks.set(token, { title: cleanSegment(folder.name) || 'Folder', entries, folders, expires: now + 15 * 60000 });
    ResponseFormatter_1.ResponseFormatter.success(res, { token, files: entries.length, folders: folders.length, totalSize });
}));
async function zipDownload(req, res) {
    const link = zipLinks.get(String(req.params.token));
    if (!link || link.expires < Date.now())
        return res.status(410).send('This download link has expired. Go back to MaxHub and click Download folder again.');
    zipLinks.delete(String(req.params.token));
    const archiver = require('archiver');
    const zip = archiver('zip', { zlib: { level: 3 } });
    const failed = [];
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(link.title)}.zip"; filename*=UTF-8''${encodeURIComponent(link.title)}.zip`);
    zip.on('warning', () => undefined);
    zip.on('error', () => { try {
        res.end();
    }
    catch { } });
    zip.pipe(res);
    for (const f of link.folders)
        zip.append('', { name: f });
    const { Readable } = require('stream');
    for (const e of link.entries) {
        try {
            if (/^https?:\/\//i.test(e.path)) {
                const r = await fetch(e.path);
                if (!r.ok || !r.body)
                    throw new Error(String(r.status));
                const done = new Promise((ok) => zip.once('entry', ok));
                zip.append(Readable.fromWeb(r.body), { name: e.name });
                await done;
            }
            else {
                const local = path_1.default.join(process.cwd(), e.path.replace(/^\//, ''));
                if (!fs_1.default.existsSync(local))
                    throw new Error('missing');
                const done = new Promise((ok) => zip.once('entry', ok));
                zip.file(local, { name: e.name });
                await done;
            }
        }
        catch {
            failed.push(e.name);
        }
    }
    if (failed.length)
        zip.append(`These files could not be fetched and are not in this ZIP:\n\n${failed.join('\n')}\n`, { name: '_MISSING FILES.txt' });
    await zip.finalize();
}
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { folderId, search } = req.query;
    const { general, mine, named } = await ensureFolders(req);
    const where = { isFolder: false };
    if (folderId) {
        if (!(await isFolderAccessible(req, folderId, user))) {
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
        }
        where.folderId = folderId;
    }
    else {
        where.folderId = { [sequelize_1.Op.in]: [general.uuid, mine.uuid, ...named.map((f) => f.uuid)] };
    }
    if (search)
        where.name = { [sequelize_1.Op.iLike]: `%${search}%` };
    const files = await FileRecord_model_1.FileRecord.findAll({ where, order: [['createdAt', 'DESC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, files.map(withUrl));
}));
router.post('/upload', multer_1.upload.single('file'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { folderId } = req.body;
    if (!(await isFolderAccessible(req, folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
    }
    const { url, name: directName, mimeType: directMimeType, size: directSize } = req.body;
    if (url) {
        const record = await FileRecord_model_1.FileRecord.create({
            uuid: (0, uuid_1.v4)(),
            name: directName || url.split('/').pop(),
            originalName: directName || url.split('/').pop(),
            path: url,
            mimeType: directMimeType || 'application/octet-stream',
            size: Number(directSize) || 0,
            folderId: folderId || null,
            isFolder: false,
            uploadedById: user?.id,
            uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
        });
        return ResponseFormatter_1.ResponseFormatter.success(res, withUrl(record), 'File uploaded', 201);
    }
    if (req.file) {
        const record = await FileRecord_model_1.FileRecord.create({
            uuid: (0, uuid_1.v4)(),
            name: req.file.originalname,
            originalName: req.file.originalname,
            path: (0, multer_1.getFileUrl)(req.file.filename),
            mimeType: req.file.mimetype,
            size: req.file.size,
            folderId: folderId || null,
            isFolder: false,
            uploadedById: user?.id,
            uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
        });
        return ResponseFormatter_1.ResponseFormatter.success(res, withUrl(record), 'File uploaded', 201);
    }
    const { name, base64Content, mimeType } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'File name or multipart file required', 400);
    let filePath = null;
    let size = 0;
    if (base64Content) {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        fs_1.default.mkdirSync(uploadDir, { recursive: true });
        const ext = path_1.default.extname(name) || '';
        const filename = `${(0, uuid_1.v4)()}${ext}`;
        const buffer = Buffer.from(base64Content, 'base64');
        fs_1.default.writeFileSync(path_1.default.join(uploadDir, filename), buffer);
        filePath = (0, multer_1.getFileUrl)(filename);
        size = buffer.length;
    }
    const record = await FileRecord_model_1.FileRecord.create({
        uuid: (0, uuid_1.v4)(),
        name,
        originalName: name,
        path: filePath,
        mimeType: mimeType || 'application/octet-stream',
        size,
        folderId: folderId || null,
        isFolder: false,
        uploadedById: user?.id,
        uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, withUrl(record), 'File uploaded', 201);
}));
router.get('/:id/download', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const file = await FileRecord_model_1.FileRecord.findOne({ where: { ...byId(req.params.id), isFolder: false } });
    if (!file)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'File not found');
    if (!(await isFolderAccessible(req, file.folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
    }
    if (file.path && /^https?:\/\//i.test(file.path)) {
        return res.redirect(file.path);
    }
    if (file.path) {
        const localPath = path_1.default.join(process.cwd(), file.path.replace(/^\//, ''));
        if (fs_1.default.existsSync(localPath)) {
            return res.download(localPath, file.originalName || file.name);
        }
    }
    ResponseFormatter_1.ResponseFormatter.error(res, 'File content not available on disk', 404);
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const file = await FileRecord_model_1.FileRecord.findOne({ where: byId(req.params.id) });
    if (!file)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'File not found');
    if (!file.isFolder && !(await isFolderAccessible(req, file.folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
    }
    if (file.isFolder ? (isSystemFolder(file) || !canChangeFolder(req, file)) : !canChangeFolder(req, file)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only the person who uploaded this (or an Admin) can delete it', req.path);
    }
    if (!file.isFolder && file.path) {
        const localPath = path_1.default.join(process.cwd(), file.path.replace(/^\//, ''));
        if (fs_1.default.existsSync(localPath))
            fs_1.default.unlinkSync(localPath);
    }
    await file.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'File deleted');
}));
const renameHandler = ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { name } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'New name is required', 400);
    const file = await FileRecord_model_1.FileRecord.findOne({ where: byId(req.params.id) });
    if (!file)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'File not found');
    if (!file.isFolder && !(await isFolderAccessible(req, file.folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
    }
    if (file.isFolder ? (isSystemFolder(file) || !canChangeFolder(req, file)) : !canChangeFolder(req, file)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only the owner (or an Admin) can rename this', req.path);
    }
    await file.update({ name: String(name).trim().slice(0, 255) });
    ResponseFormatter_1.ResponseFormatter.success(res, withUrl(file), 'File renamed');
});
router.patch('/:id/rename', renameHandler);
router.patch('/:id', renameHandler);
router.post('/:id/share', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { emails } = req.body;
    ResponseFormatter_1.ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));
exports.default = router;
//# sourceMappingURL=file.routes.js.map