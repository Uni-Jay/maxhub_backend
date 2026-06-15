"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_EmailConfig extends sequelize_1.Model {
}
PHASE25_EmailConfig.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    providerType: {
        type: sequelize_1.DataTypes.ENUM('SMTP', 'SENDGRID', 'AWS_SES', 'MAILGUN'),
        allowNull: false,
    },
    hostname: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
        comment: 'SMTP hostname',
    },
    port: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        comment: 'SMTP port',
    },
    username: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    passwordEncrypted: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted password - never expose',
    },
    fromEmail: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    fromName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    replyToEmail: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    useSSL: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    useTLS: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Default config for org',
    },
    webhookUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        comment: 'Webhook endpoint for bounce/delivery events',
    },
    webhookSecret: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
        comment: 'Encrypted webhook secret',
    },
    bounceHandling: {
        type: sequelize_1.DataTypes.ENUM('SOFT', 'HARD', 'BOTH'),
        allowNull: false,
        defaultValue: 'BOTH',
    },
    maxRetries: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
    },
    retryDelayMinutes: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
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
    tableName: 'phase25_email_config',
    timestamps: true,
    indexes: [
        {
            fields: ['organizationId', 'isActive'],
        },
        {
            fields: ['organizationId', 'isDefault'],
        },
    ],
});
exports.default = PHASE25_EmailConfig;
//# sourceMappingURL=PHASE-25-EmailConfig.model.js.map