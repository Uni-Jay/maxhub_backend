"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Broadcast_model_1 = require("../models/Broadcast.model");
const Staff_model_1 = require("../models/Staff.model");
const Notification_model_1 = require("../models/Notification.model");
const idOrUuid_1 = require("../utils/idOrUuid");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const PermissionCodes_1 = require("../config/PermissionCodes");
const router = (0, express_1.Router)();
router.get('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BROADCAST_READ_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const broadcasts = await Broadcast_model_1.Broadcast.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
    ResponseFormatter_1.ResponseFormatter.success(res, broadcasts);
}));
router.post('/', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BROADCAST_CREATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { title, message, audienceType = 'All', audienceValue } = req.body;
    if (!title || !message) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title and message are required', 400);
    }
    if (audienceType !== 'All' && !audienceValue) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'audienceValue is required for BusinessUnit/Department audiences', 400);
    }
    const broadcast = await Broadcast_model_1.Broadcast.create({
        title,
        message,
        audienceType,
        audienceValue,
        createdById: BigInt(req.user.id),
    });
    const where = {};
    if (audienceType === 'BusinessUnit')
        where.businessUnit = audienceValue;
    if (audienceType === 'Department')
        where.departmentId = BigInt(audienceValue);
    const recipients = await Staff_model_1.Staff.findAll({ where, attributes: ['userId'] });
    const recipientUserIds = [...new Set(recipients.map((s) => s.userId).filter(Boolean))];
    if (recipientUserIds.length > 0) {
        await Notification_model_1.Notification.bulkCreate(recipientUserIds.map((userId) => ({
            recipientUserId: userId,
            notificationType: 'Alert',
            title,
            message,
            relatedEntityType: 'Broadcast',
            relatedEntityId: broadcast.id,
            deliveryChannel: 'InApp',
            priority: 'Medium',
        })));
    }
    ResponseFormatter_1.ResponseFormatter.success(res, { ...broadcast.toJSON(), recipientCount: recipientUserIds.length }, 'Broadcast sent', 201);
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BROADCAST_DELETE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const broadcast = await Broadcast_model_1.Broadcast.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!broadcast)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Broadcast not found');
    await broadcast.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Broadcast deleted');
}));
exports.default = router;
//# sourceMappingURL=broadcast.routes.js.map