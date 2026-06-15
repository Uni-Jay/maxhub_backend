"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadReceipt = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class ReadReceipt extends sequelize_1.Model {
}
exports.ReadReceipt = ReadReceipt;
ReadReceipt.init({
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
    readBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    readAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    readFrom: {
        type: sequelize_1.DataTypes.ENUM('Web', 'Mobile', 'Desktop', 'API'),
        defaultValue: 'Web',
    },
    deviceInfo: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'read_receipt',
    timestamps: true,
    paranoid: false,
    indexes: [
        { fields: ['organizationId'] },
        { fields: ['directMessageId'] },
        { fields: ['chatMessageId'] },
        { fields: ['readBy'] },
        { fields: ['readAt'] },
    ],
});
exports.default = ReadReceipt;
//# sourceMappingURL=MSG-ReadReceipt.model.js.map