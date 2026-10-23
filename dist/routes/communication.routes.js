"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const Client_model_1 = require("../models/Client.model");
const MessageTemplate_model_1 = require("../models/MessageTemplate.model");
const CommunicationLog_model_1 = require("../models/CommunicationLog.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const sequelize_1 = require("sequelize");
const CommunicationService_1 = require("../services/CommunicationService");
const PermissionCodes_1 = require("../config/PermissionCodes");
const router = express_1.default.Router();
router.get('/templates', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.COMM_CLIENT_MESSAGING_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const templates = await MessageTemplate_model_1.MessageTemplate.findAll({ order: [['createdAt', 'DESC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, templates.map((t) => t.toJSON()));
}));
router.post('/templates', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.COMM_CLIENT_MESSAGING_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, type, subject, emailContent, smsContent, whatsappContent } = req.body;
    const userId = req.user?.id || 1;
    const template = await MessageTemplate_model_1.MessageTemplate.create({
        name,
        type: type || 'Custom',
        subject,
        emailContent,
        smsContent,
        whatsappContent,
        isActive: true,
        createdByUserId: BigInt(userId),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, template.toJSON(), 'Template created', 201);
}));
router.patch('/templates/:id', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.COMM_CLIENT_MESSAGING_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const tpl = await MessageTemplate_model_1.MessageTemplate.findByPk(req.params.id);
    if (!tpl)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Template not found');
    await tpl.update(req.body);
    ResponseFormatter_1.ResponseFormatter.success(res, tpl.toJSON(), 'Template updated');
}));
router.delete('/templates/:id', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.COMM_CLIENT_MESSAGING_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const tpl = await MessageTemplate_model_1.MessageTemplate.findByPk(req.params.id);
    if (!tpl)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Template not found');
    await tpl.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Template deleted');
}));
router.post('/send', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.COMM_CLIENT_MESSAGING_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { channel, recipientType, recipientFilter, subject, message, selectedClientIds, scheduledAt, } = req.body;
    const userId = req.user?.id || 1;
    const where = { status: 'Active' };
    if (recipientType === 'Department' && recipientFilter?.departmentId) {
        where.departmentId = BigInt(recipientFilter.departmentId);
    }
    else if (recipientType === 'Country' && recipientFilter?.country) {
        where.country = recipientFilter.country;
    }
    else if (recipientType === 'Status' && recipientFilter?.status) {
        where.status = recipientFilter.status;
    }
    else if (recipientType === 'Selected' && selectedClientIds?.length) {
        where.id = { [sequelize_1.Op.in]: selectedClientIds.map((id) => BigInt(id)) };
    }
    const clients = await Client_model_1.Client.findAll({
        where,
        attributes: ['id', 'fullName', 'email', 'phone'],
    });
    const log = await CommunicationLog_model_1.CommunicationLog.create({
        type: 'Manual',
        channel,
        recipientType: recipientType || 'All',
        recipientFilter: recipientFilter ? JSON.stringify(recipientFilter) : undefined,
        subject,
        message,
        totalRecipients: clients.length,
        status: 'Sending',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        createdByUserId: BigInt(userId),
    });
    let successCount = 0;
    let failureCount = 0;
    for (const client of clients) {
        const result = await (0, CommunicationService_1.sendMessage)(channel, client.toJSON(), subject, message);
        if (result)
            successCount++;
        else
            failureCount++;
    }
    await log.update({
        successCount,
        failureCount,
        status: failureCount === 0 ? 'Completed' : successCount === 0 ? 'Failed' : 'Partial',
        sentAt: new Date(),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, {
        logId: Number(log.id),
        totalRecipients: clients.length,
        successCount,
        failureCount,
    }, `Message sent to ${successCount}/${clients.length} recipients`);
}));
router.get('/logs', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.COMM_CLIENT_MESSAGING_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { type, channel, status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;
    const where = {};
    if (type)
        where.type = type;
    if (channel)
        where.channel = channel;
    if (status)
        where.status = status;
    const { count, rows } = await CommunicationLog_model_1.CommunicationLog.findAndCountAll({
        where,
        limit: limitNum,
        offset,
        order: [['createdAt', 'DESC']],
    });
    res.json({
        success: true,
        data: rows,
        pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
}));
router.get('/stats', AuthMiddleware_1.default.verifyToken, AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.COMM_CLIENT_MESSAGING_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const [totalSent, emailSent, smsSent, whatsappSent, failed] = await Promise.all([
        CommunicationLog_model_1.CommunicationLog.count({ where: { status: { [sequelize_1.Op.in]: ['Completed', 'Partial'] } } }),
        CommunicationLog_model_1.CommunicationLog.count({ where: { channel: 'Email' } }),
        CommunicationLog_model_1.CommunicationLog.count({ where: { channel: 'SMS' } }),
        CommunicationLog_model_1.CommunicationLog.count({ where: { channel: 'WhatsApp' } }),
        CommunicationLog_model_1.CommunicationLog.count({ where: { status: 'Failed' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { totalSent, emailSent, smsSent, whatsappSent, failed });
}));
exports.default = router;
//# sourceMappingURL=communication.routes.js.map