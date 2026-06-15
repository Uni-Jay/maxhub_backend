"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PHASE25_BrandingConfig extends sequelize_1.Model {
}
PHASE25_BrandingConfig.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        unique: true,
    },
    logoUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
        comment: 'S3/CDN URL to logo',
    },
    faviconUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    primaryColor: {
        type: sequelize_1.DataTypes.STRING(7),
        allowNull: true,
        comment: 'Hex color code #RRGGBB',
    },
    secondaryColor: {
        type: sequelize_1.DataTypes.STRING(7),
        allowNull: true,
    },
    accentColor: {
        type: sequelize_1.DataTypes.STRING(7),
        allowNull: true,
    },
    footerText: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    companyName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    companyWebsite: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    socialMedia: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'JSON: { facebook, twitter, linkedin, instagram }',
    },
    emailTemplateHeaderHtml: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    emailTemplateFooterHtml: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    emailSignature: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    customDomain: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    brandingAssets: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Asset metadata: { logos: [], backgrounds: [] }',
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
    tableName: 'phase25_branding_config',
    timestamps: true,
});
exports.default = PHASE25_BrandingConfig;
//# sourceMappingURL=PHASE-25-BrandingConfig.model.js.map