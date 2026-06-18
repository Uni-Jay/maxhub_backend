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
const router = (0, express_1.Router)();
async function ensureFolders(req) {
    const user = req.user;
    const [general] = await FileRecord_model_1.FileRecord.findOrCreate({
        where: { isFolder: true, folderType: 'General' },
        defaults: {
            uuid: (0, uuid_1.v4)(), name: 'General Folder', isFolder: true, folderType: 'General', icon: '📁', size: 0,
        },
    });
    const [mine] = await FileRecord_model_1.FileRecord.findOrCreate({
        where: { isFolder: true, folderType: 'Personal', uploadedById: user?.id },
        defaults: {
            uuid: (0, uuid_1.v4)(), name: 'My Folder', isFolder: true, folderType: 'Personal', icon: '🔒', size: 0,
            uploadedById: user?.id,
            uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
        },
    });
    return { general, mine };
}
async function isFolderAccessible(folderUuid, user) {
    if (!folderUuid)
        return true;
    const folder = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: folderUuid, isFolder: true } });
    if (!folder)
        return true;
    if (folder.folderType === 'Personal' && String(folder.uploadedById) !== String(user?.id))
        return false;
    return true;
}
router.get('/folders', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { general, mine } = await ensureFolders(req);
    ResponseFormatter_1.ResponseFormatter.success(res, [general, mine]);
}));
router.post('/folders', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const roles = (user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    if (!roles.includes('superadmin')) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'Only Super Admin can create additional folders', req.path);
    }
    const { name, parentId } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Folder name is required', 400);
    const folder = await FileRecord_model_1.FileRecord.create({
        uuid: (0, uuid_1.v4)(),
        name,
        folderId: parentId || null,
        isFolder: true,
        icon: '📁',
        size: 0,
        uploadedById: user?.id,
        uploadedByName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email,
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
    await folder.update({ name });
    ResponseFormatter_1.ResponseFormatter.success(res, folder, 'Folder renamed');
}));
router.delete('/folders/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const folder = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id, isFolder: true } });
    if (!folder)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Folder not found');
    await folder.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Folder deleted');
}));
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { folderId, search } = req.query;
    const { general, mine } = await ensureFolders(req);
    const where = { isFolder: false };
    if (folderId) {
        if (!(await isFolderAccessible(folderId, user))) {
            return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
        }
        where.folderId = folderId;
    }
    else {
        where.folderId = { [sequelize_1.Op.in]: [general.uuid, mine.uuid] };
    }
    if (search)
        where.name = { [sequelize_1.Op.iLike]: `%${search}%` };
    const files = await FileRecord_model_1.FileRecord.findAll({ where, order: [['createdAt', 'DESC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, files);
}));
router.post('/upload', multer_1.upload.single('file'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { folderId } = req.body;
    if (!(await isFolderAccessible(folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this folder', req.path);
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
        return ResponseFormatter_1.ResponseFormatter.success(res, record, 'File uploaded', 201);
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
    ResponseFormatter_1.ResponseFormatter.success(res, record, 'File uploaded', 201);
}));
router.get('/:id/download', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const file = await FileRecord_model_1.FileRecord.findOne({ where: { uuid: req.params.id, isFolder: false } });
    if (!file)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'File not found');
    if (!(await isFolderAccessible(file.folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
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
    if (!file.isFolder && !(await isFolderAccessible(file.folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
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
    if (!file.isFolder && !(await isFolderAccessible(file.folderId, user))) {
        return ResponseFormatter_1.ResponseFormatter.forbidden(res, 'You do not have access to this file', req.path);
    }
    await file.update({ name });
    ResponseFormatter_1.ResponseFormatter.success(res, file, 'File renamed');
}));
router.post('/:id/share', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { emails } = req.body;
    ResponseFormatter_1.ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));
exports.default = router;
//# sourceMappingURL=file.routes.js.map