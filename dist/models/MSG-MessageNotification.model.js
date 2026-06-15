"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageNotification = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class MessageNotification extends sequelize_1.Model {
}
exports.MessageNotification = MessageNotification;
MessageNotification.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    userId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (recipient)',
    },
    notificationType: {
        type: sequelize_1.DataTypes.ENUM('NewDirectMessage', 'NewChatMessage', 'Mention', 'FileShared', 'VoiceNote'),
        allowNull: false,
    },
    notificationTitle: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    notificationBody: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    sourceMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    sourceDirectMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to DirectMessage if applicable',
    },
    sourceChatMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to ChatMessage if applicable',
    },
    sourceUserId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff (sender)',
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    notificationAction: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        comment: 'Deep link for navigation',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'message_notification',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'userId'] },
        { fields: ['notificationType'] },
        { fields: ['isRead'] },
        { fields: ['createdAt'] },
        { fields: ['organizationId', 'userId', 'isRead'] },
    ],
});
exports.default = MessageNotification;
//# sourceMappingURL=MSG-MessageNotification.model.js.map