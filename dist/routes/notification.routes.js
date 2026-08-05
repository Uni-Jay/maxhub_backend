"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const idOrUuid_1 = require("@utils/idOrUuid");
const uuid_1 = require("uuid");
const Notification_model_1 = require("@models/Notification.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { page = 1, limit = 20, isRead, notificationType, priority } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = { recipientUserId: user.id };
    if (isRead !== undefined)
        where.isRead = isRead === 'true';
    if (notificationType)
        where.notificationType = notificationType;
    if (priority)
        where.priority = priority;
    const { count, rows } = await Notification_model_1.Notification.findAndCountAll({
        where, order: [['createdAt', 'DESC']], limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/unread-count', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const count = await Notification_model_1.Notification.count({ where: { recipientUserId: user.id, isRead: false } });
    ResponseFormatter_1.ResponseFormatter.success(res, { count });
}));
router.patch('/:id/read', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const notification = await Notification_model_1.Notification.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id), recipientUserId: user.id },
    });
    if (!notification)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Notification not found', 404);
    if (!notification.isRead) {
        await notification.update({ isRead: true, readAt: new Date() });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, notification, 'Marked as read');
}));
router.post('/mark-all-read', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const [updated] = await Notification_model_1.Notification.update({ isRead: true, readAt: new Date() }, { where: { recipientUserId: user.id, isRead: false } });
    ResponseFormatter_1.ResponseFormatter.success(res, { updated }, 'All notifications marked as read');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const notification = await Notification_model_1.Notification.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id), recipientUserId: user.id },
    });
    if (!notification)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Notification not found', 404);
    await notification.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Notification deleted');
}));
router.post('/', AuthMiddleware_1.default.requirePermission('comm.notification.create.all', 'sys.notification.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { recipientUserId, notificationType, title, message, actionUrl, priority, deliveryChannel } = req.body;
    if (!recipientUserId || !notificationType || !title || !message) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'recipientUserId, notificationType, title, message are required', 400);
    }
    const notification = await Notification_model_1.Notification.create({
        uuid: (0, uuid_1.v4)(), recipientUserId, notificationType, title, message,
        actionUrl, priority: priority || 'Medium',
        deliveryChannel: deliveryChannel || 'InApp', isRead: false,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, notification, 'Notification created', 201);
}));
exports.default = router;
//# sourceMappingURL=notification.routes.js.map