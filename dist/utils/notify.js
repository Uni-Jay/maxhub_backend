"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyUser = notifyUser;
exports.notifyStaff = notifyStaff;
const Notification_model_1 = require("@models/Notification.model");
const Staff_model_1 = require("@models/Staff.model");
async function notifyUser(userId, params, io) {
    const notification = await Notification_model_1.Notification.create({
        recipientUserId: userId,
        notificationType: params.type,
        title: params.title,
        message: params.message,
        relatedEntityType: params.relatedEntityType,
        relatedEntityId: params.relatedEntityId,
        actionUrl: params.actionUrl,
        deliveryChannel: 'InApp',
        priority: params.priority || 'Medium',
    });
    if (io) {
        try {
            const { emitToUser } = require('../socket/ChatSocket');
            emitToUser(io, Number(userId), 'notification:new', notification.toJSON());
        }
        catch {
        }
    }
}
async function notifyStaff(staffId, params, io) {
    const staff = await Staff_model_1.Staff.findByPk(staffId, { attributes: ['userId'] });
    if (!staff?.userId)
        return;
    await notifyUser(staff.userId, params, io);
}
//# sourceMappingURL=notify.js.map