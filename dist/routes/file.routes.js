"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
    const file = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id, isFolder: false } });
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
    const file = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id } });
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
router.patch('/:id/rename', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { name } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'New name is required', 400);
    const file = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id } });
    if (!file)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'File not found');
    if (!file.isFolder && !(await isFolderAccessible(req, file.folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
    }
    if (file.isFolder ? (isSystemFolder(file) || !canChangeFolder(req, file)) : !canChangeFolder(req, file)) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only the owner (or an Admin) can rename this', req.path);
    }
    await file.update({ name });
    ResponseFormatter_1.ResponseFormatter.success(res, withUrl(file), 'File renamed');
}));
router.post('/:id/share', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { emails } = req.body;
    ResponseFormatter_1.ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));
exports.default = router;
//# sourceMappingURL=file.routes.js.map