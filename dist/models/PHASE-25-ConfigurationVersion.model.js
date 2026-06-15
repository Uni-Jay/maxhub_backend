"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_ConfigurationVersion extends sequelize_1.Model {
}
PHASE25_ConfigurationVersion.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    configType: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
        comment: 'Type: SYSTEM, EMAIL, BRANDING, THEME, INTEGRATION',
    },
    versionNumber: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    configSnapshot: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
        comment: 'Full configuration state at this version',
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to Staff',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    rolledBackFrom: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'If this is a rollback result, which version did we roll back from?',
    },
    rolledBackTo: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'If this version was rolled back, which version did we roll back to?',
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'phase25_configuration_version',
    timestamps: false,
    indexes: [
        {
            fields: ['organizationId', 'configType', 'versionNumber'],
            unique: true,
        },
        {
            fields: ['organizationId', 'isActive'],
        },
    ],
});
exports.default = PHASE25_ConfigurationVersion;
//# sourceMappingURL=PHASE-25-ConfigurationVersion.model.js.map