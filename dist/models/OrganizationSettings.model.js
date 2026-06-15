"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationSettings = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class OrganizationSettings extends sequelize_1.Model {
}
exports.OrganizationSettings = OrganizationSettings;
OrganizationSettings.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        unique: true,
        comment: 'One settings record per organization',
    },
    taxRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
    },
    professionalTaxRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    providentFundRate: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    fiscalYearStart: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Month: 1=January, 4=April, etc',
        validate: { min: 1, max: 12 },
    },
    currencyCode: {
        type: sequelize_1.DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD',
    },
    dateFormat: {
        type: sequelize_1.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'YYYY-MM-DD',
    },
    defaultPaymentTerms: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        comment: 'Default payment terms in days',
    },
    financialYearEndMonth: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 12,
        comment: 'Month when fiscal year ends',
    },
    invoicePrefix: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'INV',
    },
    poPrefix: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'PO',
    },
    settings: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
        comment: 'Flexible additional settings',
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'organization_settings',
    timestamps: true,
    createdAt: false,
    indexes: [{ fields: ['organizationId'] }],
});
exports.default = OrganizationSettings;
//# sourceMappingURL=OrganizationSettings.model.js.map