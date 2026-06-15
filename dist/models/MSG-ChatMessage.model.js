"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ChatMessage extends sequelize_1.Model {
}
exports.ChatMessage = ChatMessage;
ChatMessage.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    departmentChatId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to DepartmentChat',
    },
    senderId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    messageText: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: false,
    },
    messageType: {
        type: sequelize_1.DataTypes.ENUM('Text', 'File', 'Image', 'Video', 'VoiceNote'),
        defaultValue: 'Text',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Sent', 'Delivered', 'Read'),
        defaultValue: 'Sent',
    },
    sentAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    isEdited: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    editedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    editedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    readByCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    mentionedUsers: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    parentMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'For reply threads',
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
    tableName: 'chat_message',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'departmentChatId'] },
        { fields: ['senderId'] },
        { fields: ['status'] },
        { fields: ['sentAt'] },
        { fields: ['messageType'] },
    ],
});
exports.default = ChatMessage;
//# sourceMappingURL=MSG-ChatMessage.model.js.map