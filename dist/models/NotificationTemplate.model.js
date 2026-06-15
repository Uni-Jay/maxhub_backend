"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTemplate = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class NotificationTemplate extends sequelize_1.Model {
}
exports.NotificationTemplate = NotificationTemplate;
NotificationTemplate.init({
    id: { type: sequelize_1.DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING(255), allowNull: false },
    code: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, unique: true, comment: 'Template identifier' },
    category: { type: sequelize_1.DataTypes.ENUM('ATTENDANCE', 'LEAVE', 'PERFORMANCE', 'SYSTEM', 'MESSAGING', 'ALERT'), allowNull: false },
    type: { type: sequelize_1.DataTypes.ENUM('REAL_TIME', 'EMAIL', 'SMS', 'PUSH'), allowNull: false },
    subject: { type: sequelize_1.DataTypes.STRING(255), allowNull: true, comment: 'For email notifications' },
    templateBody: { type: sequelize_1.DataTypes.TEXT, allowNull: false, comment: 'Template with {{variables}}' },
    variables: { type: sequelize_1.DataTypes.JSON, allowNull: false, comment: 'List of required variables' },
    isActive: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    createdBy: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    updatedBy: { type: sequelize_1.DataTypes.BIGINT, allowNull: true },
    createdAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    updatedAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: Database_1.default,
    tableName: 'notification_templates',
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'type'] },
        { fields: ['code'], unique: true },
    ],
});
exports.default = NotificationTemplate;
//# sourceMappingURL=NotificationTemplate.model.js.map