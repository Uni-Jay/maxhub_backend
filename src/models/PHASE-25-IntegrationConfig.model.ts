import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_IntegrationConfigAttributes {
  id: number;
  organizationId: number;
  integrationType: 'SMS' | 'EMAIL' | 'PAYMENT' | 'STORAGE' | 'DOCUMENT_SIGNING' | 'ANALYTICS' | 'VOIP' | 'CUSTOM';
  providerName: 'TWILIO' | 'SENDGRID' | 'AWS_SES' | 'STRIPE' | 'RAZORPAY' | 'DOCUSIGN' | 'AWS_S3' | 'AZURE_BLOB' | 'FIREBASE' | 'CUSTOM';
  apiKey: string; // Encrypted
  apiSecret: string; // Encrypted
  webhookUrl: string;
  webhookSecret: string; // Encrypted
  customConfig: any; // JSON for provider-specific settings
  isActive: boolean;
  isVerified: boolean;
  verifiedAt: Date;
  testConnectionResult: any; // JSON with connection test results
  lastTestAt: Date;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PHASE25_IntegrationConfigCreationAttributes extends Optional<PHASE25_IntegrationConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PHASE25_IntegrationConfig extends Model<PHASE25_IntegrationConfigAttributes, PHASE25_IntegrationConfigCreationAttributes> implements PHASE25_IntegrationConfigAttributes {
  public id!: number;
  public organizationId!: number;
  public integrationType!: 'SMS' | 'EMAIL' | 'PAYMENT' | 'STORAGE' | 'DOCUMENT_SIGNING' | 'ANALYTICS' | 'VOIP' | 'CUSTOM';
  public providerName!: 'TWILIO' | 'SENDGRID' | 'AWS_SES' | 'STRIPE' | 'RAZORPAY' | 'DOCUSIGN' | 'AWS_S3' | 'AZURE_BLOB' | 'FIREBASE' | 'CUSTOM';
  public apiKey!: string;
  public apiSecret!: string;
  public webhookUrl!: string;
  public webhookSecret!: string;
  public customConfig!: any;
  public isActive!: boolean;
  public isVerified!: boolean;
  public verifiedAt!: Date;
  public testConnectionResult!: any;
  public lastTestAt!: Date;
  public updatedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PHASE25_IntegrationConfig.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    organizationId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    integrationType: {
      type: DataTypes.ENUM('SMS', 'EMAIL', 'PAYMENT', 'STORAGE', 'DOCUMENT_SIGNING', 'ANALYTICS', 'VOIP', 'CUSTOM'),
      allowNull: false,
    },
    providerName: {
      type: DataTypes.ENUM('TWILIO', 'SENDGRID', 'AWS_SES', 'STRIPE', 'RAZORPAY', 'DOCUSIGN', 'AWS_S3', 'AZURE_BLOB', 'FIREBASE', 'CUSTOM'),
      allowNull: false,
    },
    apiKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted API key',
    },
    apiSecret: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted API secret',
    },
    webhookUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    webhookSecret: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted webhook secret',
    },
    customConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Provider-specific configuration',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    testConnectionResult: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Result of connection test { success, message, timestamp }',
    },
    lastTestAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
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
  }
);

export default PHASE25_IntegrationConfig;
