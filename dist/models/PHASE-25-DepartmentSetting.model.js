"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_DepartmentSetting extends sequelize_1.Model {
}
PHASE25_DepartmentSetting.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'Multi-tenant org',
    },
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Department',
    },
    settingKey: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        comment: 'e.g., leave_quota, budget_allocation',
    },
    settingValue: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
    settingType: {
        type: sequelize_1.DataTypes.ENUM('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE'),
        allowNull: false,
        defaultValue: 'STRING',
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'phase25_department_settings',
    timestamps: true,
    indexes: [
        {
            fields: ['organizationId', 'departmentId', 'settingKey'],
            unique: true,
        },
        {
            fields: ['departmentId', 'settingKey'],
        },
    ],
});
exports.default = PHASE25_DepartmentSetting;
//# sourceMappingURL=PHASE-25-DepartmentSetting.model.js.map