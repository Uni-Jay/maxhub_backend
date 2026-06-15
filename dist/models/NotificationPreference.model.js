"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreference = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class NotificationPreference extends sequelize_1.Model {
}
exports.NotificationPreference = NotificationPreference;
NotificationPreference.init({
    id: { type: sequelize_1.DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    staffId: { type: sequelize_1.DataTypes.BIGINT, allowNull: false },
    emailEnabled: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    smsEnabled: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    pushEnabled: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    realTimeEnabled: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    inAppEnabled: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: true },
    dailyDigestEnabled: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false },
    categories: { type: sequelize_1.DataTypes.JSON, defaultValue: ['ATTENDANCE', 'LEAVE', 'SYSTEM'], comment: 'Enabled notification categories' },
    quietHours: { type: sequelize_1.DataTypes.JSON, allowNull: true, comment: 'No notifications between these times' },
    createdAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
    updatedAt: { type: sequelize_1.DataTypes.DATE, defaultValue: sequelize_1.DataTypes.NOW },
}, {
    sequelize: Database_1.default,
    tableName: 'notification_preferences',
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'staffId'], unique: true },
    ],
});
exports.default = NotificationPreference;
//# sourceMappingURL=NotificationPreference.model.js.map