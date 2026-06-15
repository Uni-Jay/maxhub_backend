import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: OrganizationSettings
 * Enables: Customizable org-wide configuration, tax rates, fiscal year, defaults
 * Replaces: Hardcoded settings, environment variables
 * Multi-tenancy: Per-organization settings without code changes
 */
export interface IOrganizationSettings {
  id: bigint;
  organizationId: bigint;
  taxRate: number; // Default tax percentage
  professionalTaxRate?: number;
  providentFundRate?: number;
  fiscalYearStart: number; // Month (1-12)
  currencyCode: string;
  dateFormat: string;
  defaultPaymentTerms: number; // Days
  financialYearEndMonth: number;
  invoicePrefix: string;
  poPrefix: string;
  settings?: JSON; // Flexible config
  updatedAt: Date;
}

export class OrganizationSettings
  extends Model<IOrganizationSettings>
  implements IOrganizationSettings
{
  declare id: bigint;
  declare organizationId: bigint;
  declare taxRate: number;
  declare professionalTaxRate?: number;
  declare providentFundRate?: number;
  declare fiscalYearStart: number;
  declare currencyCode: string;
  declare dateFormat: string;
  declare defaultPaymentTerms: number;
  declare financialYearEndMonth: number;
  declare invoicePrefix: string;
  declare poPrefix: string;
  declare settings?: JSON;
  declare updatedAt: Date;
}

OrganizationSettings.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
      comment: 'One settings record per organization',
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    professionalTaxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    providentFundRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    fiscalYearStart: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Month: 1=January, 4=April, etc',
      validate: { min: 1, max: 12 },
    },
    currencyCode: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
    },
    dateFormat: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'YYYY-MM-DD',
    },
    defaultPaymentTerms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: 'Default payment terms in days',
    },
    financialYearEndMonth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 12,
      comment: 'Month when fiscal year ends',
    },
    invoicePrefix: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'INV',
    },
    poPrefix: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'PO',
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Flexible additional settings',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'organization_settings',
    timestamps: true,
    createdAt: false,
    indexes: [{ fields: ['organizationId'] }],
  }
);

export default OrganizationSettings;
