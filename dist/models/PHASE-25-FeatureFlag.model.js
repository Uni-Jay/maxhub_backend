"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_FeatureFlag extends sequelize_1.Model {
}
PHASE25_FeatureFlag.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    flagKey: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        comment: 'Unique flag key (e.g., new_dashboard_v2)',
    },
    flagName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    isEnabled: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    flagType: {
        type: sequelize_1.DataTypes.ENUM('BOOLEAN', 'PERCENTAGE', 'USER_LIST', 'CUSTOM'),
        allowNull: false,
        defaultValue: 'BOOLEAN',
    },
    rolloutPercentage: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0, max: 100 },
        comment: 'For gradual rollout (0-100%)',
    },
    targetUsers: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Array of staffIds for USER_LIST type',
    },
    targetRoles: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Array of roles (ADMIN, MANAGER, etc)',
    },
    targetDepartments: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Array of departmentIds',
    },
    conditions: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Complex conditions for CUSTOM type',
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Additional data (analytics, tracking, etc)',
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    enabledAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    disabledAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
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
    tableName: 'phase25_feature_flag',
    timestamps: true,
    indexes: [
        {
            fields: ['organizationId', 'flagKey'],
            unique: true,
        },
        {
            fields: ['organizationId', 'isEnabled'],
        },
    ],
});
exports.default = PHASE25_FeatureFlag;
//# sourceMappingURL=PHASE-25-FeatureFlag.model.js.map