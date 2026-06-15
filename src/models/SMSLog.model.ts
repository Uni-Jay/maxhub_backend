import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

export interface ISMSLog {
  id: bigint;
  organizationId: bigint;
  notificationId: bigint;
  recipientPhone: string;
  messageText: string;
  deliveryStatus: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  providerReference?: string;
  retryCount: number;
  lastRetryAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type SMSLogCreationAttributes = Optional<ISMSLog, 'id' | 'createdAt' | 'updatedAt' | 'sentAt' | 'deliveredAt' | 'failureReason' | 'providerReference' | 'retryCount' | 'lastRetryAt'>;

export class SMSLog extends Model<ISMSLog, SMSLogCreationAttributes> implements ISMSLog {
  public id!: bigint;
  public organizationId!: bigint;
  public notificationId!: bigint;
  public recipientPhone!: string;
  public messageText!: string;
  public deliveryStatus!: 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  public sentAt?: Date;
  public deliveredAt?: Date;
  public failureReason?: string;
  public providerReference?: string;
  public retryCount!: number;
  public lastRetryAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SMSLog.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: DataTypes.BIGINT, allowNull: false },
    notificationId: { type: DataTypes.BIGINT, allowNull: false },
    recipientPhone: { type: DataTypes.STRING(20), allowNull: false },
    messageText: { type: DataTypes.STRING(1000), allowNull: false, comment: 'SMS message content' },
    deliveryStatus: { type: DataTypes.ENUM('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED'), defaultValue: 'QUEUED' },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    failureReason: { type: DataTypes.TEXT, allowNull: true },
    providerReference: { type: DataTypes.STRING(255), allowNull: true, comment: 'Twilio/AWS SNS reference ID' },
    retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastRetryAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'sms_logs',
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'deliveryStatus'] },
      { fields: ['notificationId'] },
      { fields: ['recipientPhone', 'createdAt'] },
    ],
  }
);

export default SMSLog;
