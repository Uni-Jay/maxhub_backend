"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_SettingAuditLog extends sequelize_1.Model {
}
PHASE25_SettingAuditLog.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    settingKey: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    oldValue: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    newValue: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    changedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    reason: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    changeType: {
        type: sequelize_1.DataTypes.ENUM('SYSTEM', 'DEPARTMENT', 'EMAIL', 'BRANDING', 'THEME', 'INTEGRATION'),
        allowNull: false,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.STRING(45),
        allowNull: true,
    },
    userAgent: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'phase25_setting_audit_log',
    timestamps: false,
    indexes: [
        {
            fields: ['organizationId', 'settingKey', 'createdAt'],
        },
        {
            fields: ['changedBy', 'createdAt'],
        },
        {
            fields: ['createdAt'],
        },
    ],
});
exports.default = PHASE25_SettingAuditLog;
//# sourceMappingURL=PHASE-25-SettingAuditLog.model.js.map