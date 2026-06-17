"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.get('/folders', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const folders = [
        { id: 'f1', name: 'Company Documents', parentId: null, icon: '🏢' },
        { id: 'f2', name: 'HR Files', parentId: null, icon: '👥' },
        { id: 'f3', name: 'Projects', parentId: null, icon: '📁' },
        { id: 'f4', name: 'Certificates', parentId: null, icon: '🏆' },
        { id: 'f5', name: 'Shared', parentId: null, icon: '🔗' },
        { id: 'f6', name: 'Staff Contracts', parentId: 'f2', icon: '📄' },
        { id: 'f7', name: 'Payroll Records', parentId: 'f2', icon: '💰' },
    ];
    ResponseFormatter_1.ResponseFormatter.success(res, folders);
}));
router.post('/folders', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, parentId } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Folder name is required', 400);
    const folder = { id: (0, uuid_1.v4)(), name, parentId: parentId || null, icon: '📁', createdAt: new Date() };
    ResponseFormatter_1.ResponseFormatter.success(res, folder, 'Folder created', 201);
}));
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { folderId, search } = req.query;
    const sampleFiles = [
        { id: '1', name: 'Employee Handbook 2025.pdf', size: 2456789, mimeType: 'application/pdf', folderId: 'f2', uploadedBy: 'HR Team', createdAt: new Date('2025-01-15') },
        { id: '2', name: 'Company Policy.docx', size: 345678, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', folderId: 'f1', uploadedBy: 'Admin', createdAt: new Date('2025-01-10') },
        { id: '3', name: 'Q1 2025 Report.xlsx', size: 1234567, mimeType: 'application/vnd.ms-excel', folderId: 'f1', uploadedBy: 'Finance', createdAt: new Date('2025-03-31') },
        { id: '4', name: 'MaxHub Logo.png', size: 89012, mimeType: 'image/png', folderId: 'f1', uploadedBy: 'Admin', createdAt: new Date('2025-01-01') },
    ];
    let files = folderId ? sampleFiles.filter(f => f.folderId === folderId) : sampleFiles;
    if (search)
        files = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    ResponseFormatter_1.ResponseFormatter.success(res, files);
}));
router.post('/upload', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { name, base64Content, folderId, mimeType } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'File name is required', 400);
    const file = {
        id: (0, uuid_1.v4)(),
        name, folderId, mimeType,
        size: base64Content ? Math.round(base64Content.length * 0.75) : 0,
        uploadedBy: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        url: base64Content ? `data:${mimeType};base64,${base64Content}` : null,
        createdAt: new Date(),
    };
    ResponseFormatter_1.ResponseFormatter.success(res, file, 'File uploaded', 201);
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'File deleted');
}));
router.patch('/:id/rename', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'New name is required', 400);
    ResponseFormatter_1.ResponseFormatter.success(res, { id: req.params.id, name }, 'File renamed');
}));
router.post('/:id/share', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { emails } = req.body;
    ResponseFormatter_1.ResponseFormatter.success(res, { sharedWith: emails }, 'File shared');
}));
exports.default = router;
//# sourceMappingURL=file.routes.js.map