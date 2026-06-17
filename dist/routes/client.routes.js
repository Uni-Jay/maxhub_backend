"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sequelize_1 = require("sequelize");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const Client_model_1 = require("../models/Client.model");
const ClientDocument_model_1 = require("../models/ClientDocument.model");
const ClientNote_model_1 = require("../models/ClientNote.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = express_1.default.Router();
router.get('/', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { search, status, departmentId, assignedStaffId, country, page = '1', limit = '20', } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;
    const where = {};
    if (status)
        where.status = status;
    if (country)
        where.country = country;
    if (departmentId)
        where.departmentId = BigInt(departmentId);
    if (assignedStaffId)
        where.assignedStaffId = BigInt(assignedStaffId);
    if (search) {
        where[sequelize_1.Op.or] = [
            { fullName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { phone: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { clientId: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const { count, rows } = await Client_model_1.Client.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [['createdAt', 'DESC']],
        attributes: [
            'id', 'uuid', 'clientId', 'fullName', 'email', 'phone',
            'country', 'departmentId', 'assignedStaffId', 'status',
            'registrationDate', 'avatar', 'createdAt',
        ],
    });
    res.json({
        success: true,
        data: rows,
        pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
}));
router.get('/stats', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const [total, active, inactive, pending] = await Promise.all([
        Client_model_1.Client.count(),
        Client_model_1.Client.count({ where: { status: 'Active' } }),
        Client_model_1.Client.count({ where: { status: 'Inactive' } }),
        Client_model_1.Client.count({ where: { status: 'Pending' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, active, inactive, pending });
}));
router.get('/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const client = await Client_model_1.Client.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Client not found');
    ResponseFormatter_1.ResponseFormatter.success(res, client.toJSON());
}));
router.post('/', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { fullName, email, phone, alternatePhone, address, city, state, country, nationality, dateOfBirth, departmentId, assignedStaffId, status = 'Active', notes, } = req.body;
    const userId = req.user?.id || 1;
    const client = await Client_model_1.Client.create({
        fullName,
        email,
        phone,
        alternatePhone,
        address,
        city,
        state,
        country,
        nationality,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        departmentId: departmentId ? BigInt(departmentId) : undefined,
        assignedStaffId: assignedStaffId ? BigInt(assignedStaffId) : undefined,
        registrationDate: new Date(),
        status,
        notes,
        createdByUserId: BigInt(userId),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, client.toJSON(), 'Client created successfully', 201);
}));
router.patch('/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const client = await Client_model_1.Client.findByPk(req.params.id);
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Client not found');
    const updates = {};
    const allowed = [
        'fullName', 'email', 'phone', 'alternatePhone', 'address', 'city', 'state',
        'country', 'nationality', 'dateOfBirth', 'status', 'notes', 'avatar', 'passportUrl',
    ];
    for (const key of allowed) {
        if (req.body[key] !== undefined)
            updates[key] = req.body[key];
    }
    if (req.body.departmentId !== undefined)
        updates.departmentId = req.body.departmentId ? BigInt(req.body.departmentId) : null;
    if (req.body.assignedStaffId !== undefined)
        updates.assignedStaffId = req.body.assignedStaffId ? BigInt(req.body.assignedStaffId) : null;
    await client.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, client.toJSON(), 'Client updated');
}));
router.delete('/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const client = await Client_model_1.Client.findByPk(req.params.id);
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Client not found');
    await client.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Client deleted');
}));
router.get('/:id/documents', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const client = await Client_model_1.Client.findByPk(req.params.id);
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Client not found');
    const docs = await ClientDocument_model_1.ClientDocument.findAll({
        where: { clientId: client.id },
        order: [['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, docs.map((d) => d.toJSON()));
}));
router.post('/:id/documents', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const client = await Client_model_1.Client.findByPk(req.params.id);
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Client not found');
    const { documentName, category = 'Other', fileUrl, fileSize, mimeType, description } = req.body;
    const userId = req.user?.id || 1;
    const existing = await ClientDocument_model_1.ClientDocument.count({
        where: { clientId: client.id, documentName },
    });
    const doc = await ClientDocument_model_1.ClientDocument.create({
        clientId: client.id,
        documentName,
        category,
        fileUrl,
        fileSize,
        mimeType,
        description,
        version: existing + 1,
        uploadedByUserId: BigInt(userId),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, doc.toJSON(), 'Document uploaded', 201);
}));
router.delete('/:id/documents/:docId', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const doc = await ClientDocument_model_1.ClientDocument.findOne({
        where: { id: BigInt(req.params.docId), clientId: BigInt(req.params.id) },
    });
    if (!doc)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Document not found');
    await doc.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Document deleted');
}));
router.get('/:id/notes', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const client = await Client_model_1.Client.findByPk(req.params.id);
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Client not found');
    const notes = await ClientNote_model_1.ClientNote.findAll({
        where: { clientId: client.id },
        order: [['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, notes.map((n) => n.toJSON()));
}));
router.post('/:id/notes', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const client = await Client_model_1.Client.findByPk(req.params.id);
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Client not found');
    const { note } = req.body;
    const userId = req.user?.id || 1;
    const clientNote = await ClientNote_model_1.ClientNote.create({
        clientId: client.id,
        note,
        createdByUserId: BigInt(userId),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, clientNote.toJSON(), 'Note added', 201);
}));
router.delete('/:id/notes/:noteId', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const note = await ClientNote_model_1.ClientNote.findOne({
        where: { id: BigInt(req.params.noteId), clientId: BigInt(req.params.id) },
    });
    if (!note)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Note not found');
    await note.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Note deleted');
}));
exports.default = router;
//# sourceMappingURL=client.routes.js.map