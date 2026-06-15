"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const BaseController_1 = __importDefault(require("./BaseController"));
const NotificationService_1 = __importDefault(require("../services/NotificationService"));
class NotificationController extends BaseController_1.default {
    async sendNotification(req, res) {
        const { staffId, title, message, category, type, templateCode, variables, relatedEntityType, relatedEntityId, actionUrl } = req.body;
        const organizationId = req.user?.organizationId || BigInt(0);
        await this.checkPermission(req.user?.id || BigInt(0), 'notifications.create.all');
        const notification = await NotificationService_1.default.sendNotification({
            staffId: BigInt(staffId),
            organizationId: BigInt(organizationId),
            title,
            message,
            category,
            type,
            templateCode,
            variables,
            relatedEntityType,
            relatedEntityId: relatedEntityId ? BigInt(relatedEntityId) : undefined,
            actionUrl,
        });
        return this.sendSuccess(res, notification, 'Notification sent successfully', 201);
    }
    async markAsRead(req, res) {
        const { id } = req.params;
        const staffId = req.user?.id || BigInt(0);
        await this.checkPermission(staffId, 'notifications.read.own');
        await NotificationService_1.default.markAsRead(BigInt(id), staffId);
        return this.sendSuccess(res, null, 'Notification marked as read');
    }
    async getNotifications(req, res) {
        const staffId = req.user?.id || BigInt(0);
        const organizationId = req.user?.organizationId || BigInt(0);
        const { limit = 20, offset = 0 } = req.query;
        await this.checkPermission(staffId, 'notifications.read.own');
        const result = await NotificationService_1.default.getNotifications(staffId, BigInt(organizationId), parseInt(limit), parseInt(offset));
        return this.sendPaginated(res, result.data, result.pagination, 'Notifications retrieved successfully');
    }
    async getUnreadCount(req, res) {
        const staffId = req.user?.id || BigInt(0);
        const organizationId = req.user?.organizationId || BigInt(0);
        await this.checkPermission(staffId, 'notifications.read.own');
        const unreadCount = await NotificationService_1.default.getUnreadCount(staffId, BigInt(organizationId));
        return this.sendSuccess(res, { unreadCount }, 'Unread count retrieved');
    }
    async getPreferences(req, res) {
        const staffId = req.user?.id || BigInt(0);
        const organizationId = req.user?.organizationId || BigInt(0);
        await this.checkPermission(staffId, 'notifications.preferences.read.own');
        const preferences = await NotificationService_1.default.getPreferences(staffId, BigInt(organizationId));
        return this.sendSuccess(res, preferences, 'Preferences retrieved');
    }
    async updatePreferences(req, res) {
        const staffId = req.user?.id || BigInt(0);
        const organizationId = req.user?.organizationId || BigInt(0);
        await this.checkPermission(staffId, 'notifications.preferences.update.own');
        const preferences = await NotificationService_1.default.updatePreferences(staffId, BigInt(organizationId), req.body);
        return this.sendSuccess(res, preferences, 'Preferences updated');
    }
}
exports.NotificationController = NotificationController;
exports.default = new NotificationController();
//# sourceMappingURL=NotificationController.js.map