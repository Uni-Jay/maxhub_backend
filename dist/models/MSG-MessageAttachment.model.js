"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageAttachment = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class MessageAttachment extends sequelize_1.Model {
}
exports.MessageAttachment = MessageAttachment;
MessageAttachment.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    directMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to DirectMessage',
    },
    chatMessageId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to ChatMessage',
    },
    fileUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    fileName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    fileSize: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'File size in bytes',
    },
    fileType: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    fileExtension: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: true,
    },
    uploadedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    uploadedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff',
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
    tableName: 'message_attachment',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId'] },
        { fields: ['directMessageId'] },
        { fields: ['chatMessageId'] },
        { fields: ['fileType'] },
    ],
});
exports.default = MessageAttachment;
//# sourceMappingURL=MSG-MessageAttachment.model.js.map