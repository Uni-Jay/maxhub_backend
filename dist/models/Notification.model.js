"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Notification extends sequelize_1.Model {
    static initModel(sequelize) {
        Notification.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            recipientUserId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Recipient user ID' },
            notificationType: { type: sequelize_1.DataTypes.ENUM('Message', 'Mention', 'Assignment', 'Leave', 'Payroll', 'System', 'Alert', 'Other'), allowNull: false },
            title: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Notification title' },
            message: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Notification message' },
            relatedEntityType: { type: sequelize_1.DataTypes.STRING(50), allowNull: true, comment: 'Related entity type' },
            relatedEntityId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Related entity ID' },
            actionUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Action URL' },
            isRead: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is read' },
            readAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'When read' },
            deliveryChannel: { type: sequelize_1.DataTypes.ENUM('InApp', 'Email', 'SMS', 'Push'), defaultValue: 'InApp' },
            priority: { type: sequelize_1.DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'), defaultValue: 'Medium' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'notifications', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['recipientUserId'], name: 'idx_notifications_recipientUserId' },
                { fields: ['notificationType'], name: 'idx_notifications_notificationType' },
                { fields: ['isRead'], name: 'idx_notifications_isRead' },
                { fields: ['priority'], name: 'idx_notifications_priority' },
                { fields: ['deliveryChannel'], name: 'idx_notifications_deliveryChannel' },
                { fields: ['createdAt'], name: 'idx_notifications_createdAt' },
                { fields: ['uuid'], name: 'idx_notifications_uuid' },
            ],
            comment: 'Notifications'
        });
        return Notification;
    }
}
exports.Notification = Notification;
//# sourceMappingURL=Notification.model.js.map