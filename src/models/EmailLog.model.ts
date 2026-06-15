import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

export interface IEmailLog {
  id: bigint;
  organizationId: bigint;
  notificationId: bigint;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  deliveryStatus: 'QUEUED' | 'SENDING' | 'SENT' | 'BOUNCED' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  bouncedAt?: Date;
  failureReason?: string;
  providerReference?: string;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type EmailLogCreationAttributes = Optional<IEmailLog, 'id' | 'createdAt' | 'updatedAt' | 'sentAt' | 'deliveredAt' | 'bouncedAt' | 'failureReason' | 'providerReference' | 'retryCount' | 'lastRetryAt'>;

export class EmailLog extends Model<IEmailLog, EmailLogCreationAttributes> implements IEmailLog {
  public id!: bigint;
  public organizationId!: bigint;
  public notificationId!: bigint;
  public recipientEmail!: string;
  public subject!: string;
  public bodyHtml!: string;
  public deliveryStatus!: 'QUEUED' | 'SENDING' | 'SENT' | 'BOUNCED' | 'FAILED';
  public sentAt?: Date;
  public deliveredAt?: Date;
  public bouncedAt?: Date;
  public failureReason?: string;
  public providerReference?: string;
  public retryCount!: number;
  public lastRetryAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailLog.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: DataTypes.BIGINT, allowNull: false },
    notificationId: { type: DataTypes.BIGINT, allowNull: false },
    recipientEmail: { type: DataTypes.STRING(255), allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    bodyHtml: { type: DataTypes.TEXT, allowNull: false },
    deliveryStatus: { type: DataTypes.ENUM('QUEUED', 'SENDING', 'SENT', 'BOUNCED', 'FAILED'), defaultValue: 'QUEUED' },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    bouncedAt: { type: DataTypes.DATE, allowNull: true },
    failureReason: { type: DataTypes.TEXT, allowNull: true },
    providerReference: { type: DataTypes.STRING(255), allowNull: true, comment: 'SES/SendGrid reference ID' },
    retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastRetryAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'email_logs',
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'deliveryStatus'] },
      { fields: ['notificationId'] },
      { fields: ['recipientEmail', 'createdAt'] },
    ],
  }
);

export default EmailLog;
