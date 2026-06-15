import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

interface PHASE25_EmailConfigAttributes {
  id: number;
  organizationId: number;
  providerType: 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'MAILGUN';
  hostname: string;
  port: number;
  username: string;
  passwordEncrypted: string; // Encrypted password
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
  useSSL: boolean;
  useTLS: boolean;
  isActive: boolean;
  isDefault: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  bounceHandling: 'SOFT' | 'HARD' | 'BOTH';
  maxRetries: number;
  retryDelayMinutes: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PHASE25_EmailConfigCreationAttributes extends Optional<PHASE25_EmailConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PHASE25_EmailConfig extends Model<PHASE25_EmailConfigAttributes, PHASE25_EmailConfigCreationAttributes> implements PHASE25_EmailConfigAttributes {
  public id!: number;
  public organizationId!: number;
  public providerType!: 'SMTP' | 'SENDGRID' | 'AWS_SES' | 'MAILGUN';
  public hostname!: string;
  public port!: number;
  public username!: string;
  public passwordEncrypted!: string;
  public fromEmail!: string;
  public fromName!: string;
  public replyToEmail?: string;
  public useSSL!: boolean;
  public useTLS!: boolean;
  public isActive!: boolean;
  public isDefault!: boolean;
  public webhookUrl?: string;
  public webhookSecret?: string;
  public bounceHandling!: 'SOFT' | 'HARD' | 'BOTH';
  public maxRetries!: number;
  public retryDelayMinutes!: number;
  public updatedBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PHASE25_EmailConfig.init(
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
    providerType: {
      type: DataTypes.ENUM('SMTP', 'SENDGRID', 'AWS_SES', 'MAILGUN'),
      allowNull: false,
    },
    hostname: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'SMTP hostname',
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'SMTP port',
    },
    username: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    passwordEncrypted: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted password - never expose',
    },
    fromEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fromName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    replyToEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    useSSL: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    useTLS: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Default config for org',
    },
    webhookUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Webhook endpoint for bounce/delivery events',
    },
    webhookSecret: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted webhook secret',
    },
    bounceHandling: {
      type: DataTypes.ENUM('SOFT', 'HARD', 'BOTH'),
      allowNull: false,
      defaultValue: 'BOTH',
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    retryDelayMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
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
  }
);

export default PHASE25_EmailConfig;
