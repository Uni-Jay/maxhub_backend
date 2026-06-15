"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_IntegrationConfig extends sequelize_1.Model {
}
PHASE25_IntegrationConfig.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    integrationType: {
        type: sequelize_1.DataTypes.ENUM('SMS', 'EMAIL', 'PAYMENT', 'STORAGE', 'DOCUMENT_SIGNING', 'ANALYTICS', 'VOIP', 'CUSTOM'),
        allowNull: false,
    },
    providerName: {
        type: sequelize_1.DataTypes.ENUM('TWILIO', 'SENDGRID', 'AWS_SES', 'STRIPE', 'RAZORPAY', 'DOCUSIGN', 'AWS_S3', 'AZURE_BLOB', 'FIREBASE', 'CUSTOM'),
        allowNull: false,
    },
    apiKey: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted API key',
    },
    apiSecret: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted API secret',
    },
    webhookUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    webhookSecret: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted webhook secret',
    },
    customConfig: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Provider-specific configuration',
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    verifiedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    testConnectionResult: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Result of connection test { success, message, timestamp }',
    },
    lastTestAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
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
    tableName: 'phase25_integration_config',
    timestamps: true,
    indexes: [
        {
            fields: ['organizationId', 'integrationType'],
        },
        {
            fields: ['organizationId', 'isActive'],
        },
    ],
});
exports.default = PHASE25_IntegrationConfig;
//# sourceMappingURL=PHASE-25-IntegrationConfig.model.js.map