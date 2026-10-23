"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const StaffQuery_model_1 = require("../models/StaffQuery.model");
const StaffQueryReply_model_1 = require("../models/StaffQueryReply.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.get('/', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status, priority, type, assignedStaffId, departmentId, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;
    const where = {};
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (type)
        where.type = type;
    if (assignedStaffId)
        where.assignedStaffId = BigInt(assignedStaffId);
    if (departmentId)
        where.departmentId = BigInt(departmentId);
    if (search) {
        where[sequelize_1.Op.or] = [
            { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { description: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const { count, rows } = await StaffQuery_model_1.StaffQuery.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [['createdAt', 'DESC']],
    });
    const [total, pending, inProgress, resolved, overdue] = await Promise.all([
        StaffQuery_model_1.StaffQuery.count(),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'Pending' } }),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'InProgress' } }),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'Resolved' } }),
        StaffQuery_model_1.StaffQuery.count({
            where: {
                status: { [sequelize_1.Op.notIn]: ['Resolved', 'Closed'] },
                dueDate: { [sequelize_1.Op.lt]: new Date() },
            },
        }),
    ]);
    res.json({
        success: true,
        data: rows,
        stats: { total, pending, inProgress, resolved, overdue },
        pagination: {
            total: count,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(count / limitNum),
        },
    });
}));
router.get('/stats', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const [total, pending, inProgress, resolved, closed, overdue] = await Promise.all([
        StaffQuery_model_1.StaffQuery.count(),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'Pending' } }),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'InProgress' } }),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'Resolved' } }),
        StaffQuery_model_1.StaffQuery.count({ where: { status: 'Closed' } }),
        StaffQuery_model_1.StaffQuery.count({
            where: {
                status: { [sequelize_1.Op.notIn]: ['Resolved', 'Closed'] },
                dueDate: { [sequelize_1.Op.lt]: new Date() },
            },
        }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, pending, inProgress, resolved, closed, overdue });
}));
router.get('/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const query = await StaffQuery_model_1.StaffQuery.findByPk(req.params.id);
    if (!query)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Query not found');
    const replies = await StaffQueryReply_model_1.StaffQueryReply.findAll({
        where: { queryId: query.id },
        order: [['createdAt', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...query.toJSON(), replies: replies.map((r) => r.toJSON()) });
}));
router.post('/', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { title, description, priority = 'Medium', type = 'Query', departmentId, assignedStaffId, dueDate, attachments, } = req.body;
    const userId = req.user?.id || 1;
    const query = await StaffQuery_model_1.StaffQuery.create({
        title,
        description,
        priority,
        type,
        departmentId: departmentId ? BigInt(departmentId) : undefined,
        assignedStaffId: assignedStaffId ? BigInt(assignedStaffId) : undefined,
        createdByUserId: BigInt(userId),
        status: 'Pending',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        attachments: attachments ? JSON.stringify(attachments) : undefined,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, query.toJSON(), 'Query created successfully', 201);
}));
router.patch('/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const query = await StaffQuery_model_1.StaffQuery.findByPk(req.params.id);
    if (!query)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Query not found');
    const updates = {};
    const allowed = ['title', 'description', 'priority', 'type', 'status', 'dueDate', 'assignedStaffId', 'departmentId'];
    for (const key of allowed) {
        if (req.body[key] !== undefined) {
            if (key === 'assignedStaffId' || key === 'departmentId') {
                updates[key] = req.body[key] ? BigInt(req.body[key]) : null;
            }
            else {
                updates[key] = req.body[key];
            }
        }
    }
    if (req.body.status === 'Resolved')
        updates.resolvedAt = new Date();
    if (req.body.status === 'Closed')
        updates.closedAt = new Date();
    await query.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, query.toJSON(), 'Query updated');
}));
router.delete('/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const query = await StaffQuery_model_1.StaffQuery.findByPk(req.params.id);
    if (!query)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Query not found');
    await query.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Query deleted');
}));
router.post('/:id/replies', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const query = await StaffQuery_model_1.StaffQuery.findByPk(req.params.id);
    if (!query)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Query not found');
    const { message, isInternal = false, attachments } = req.body;
    const userId = req.user?.id || 1;
    const reply = await StaffQueryReply_model_1.StaffQueryReply.create({
        queryId: query.id,
        message,
        senderUserId: BigInt(userId),
        isInternal: Boolean(isInternal),
        attachments: attachments ? JSON.stringify(attachments) : undefined,
    });
    if (query.status === 'Pending') {
        await query.update({ status: 'InProgress' });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, reply.toJSON(), 'Reply added', 201);
}));
router.patch('/:id/resolve', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const query = await StaffQuery_model_1.StaffQuery.findByPk(req.params.id);
    if (!query)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Query not found');
    await query.update({ status: 'Resolved', resolvedAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, query.toJSON(), 'Query marked as resolved');
}));
exports.default = router;
//# sourceMappingURL=query.routes.js.map