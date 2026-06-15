"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectMessage = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class DirectMessage extends sequelize_1.Model {
}
exports.DirectMessage = DirectMessage;
DirectMessage.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    senderId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (sender)',
    },
    recipientId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff (recipient)',
    },
    messageText: {
        type: sequelize_1.DataTypes.LONGTEXT,
        allowNull: false,
    },
    messageType: {
        type: sequelize_1.DataTypes.ENUM('Text', 'File', 'Image', 'Voice'),
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
    deliveredAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isEdited: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    editedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    isDeleted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
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
    deletedAtSoft: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'direct_message',
    timestamps: true,
    paranoid: false,
    indexes: [
        { fields: ['organizationId'] },
        { fields: ['senderId', 'recipientId'] },
        { fields: ['status'] },
        { fields: ['sentAt'] },
        { fields: ['organizationId', 'senderId', 'recipientId'] },
    ],
});
exports.default = DirectMessage;
//# sourceMappingURL=MSG-DirectMessage.model.js.map