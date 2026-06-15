import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/Database';

export interface IPushLog {
  id: bigint;
  organizationId: bigint;
  notificationId: bigint;
  deviceToken: string;
  devicePlatform: 'IOS' | 'ANDROID' | 'WEB';
  title: string;
  body: string;
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

type PushLogCreationAttributes = Optional<IPushLog, 'id' | 'createdAt' | 'updatedAt' | 'sentAt' | 'deliveredAt' | 'failureReason' | 'providerReference' | 'retryCount' | 'lastRetryAt'>;

export class PushLog extends Model<IPushLog, PushLogCreationAttributes> implements IPushLog {
  public id!: bigint;
  public organizationId!: bigint;
  public notificationId!: bigint;
  public deviceToken!: string;
  public devicePlatform!: 'IOS' | 'ANDROID' | 'WEB';
  public title!: string;
  public body!: string;
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

PushLog.init(
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    organizationId: { type: DataTypes.BIGINT, allowNull: false },
    notificationId: { type: DataTypes.BIGINT, allowNull: false },
    deviceToken: { type: DataTypes.STRING(500), allowNull: false, comment: 'Device token for push' },
    devicePlatform: { type: DataTypes.ENUM('IOS', 'ANDROID', 'WEB'), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    deliveryStatus: { type: DataTypes.ENUM('QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED'), defaultValue: 'QUEUED' },
    sentAt: { type: DataTypes.DATE, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    failureReason: { type: DataTypes.TEXT, allowNull: true },
    providerReference: { type: DataTypes.STRING(255), allowNull: true, comment: 'Firebase/APNs reference' },
    retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastRetryAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'push_logs',
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'deliveryStatus'] },
      { fields: ['notificationId'] },
      { fields: ['deviceToken', 'devicePlatform'] },
    ],
  }
);

export default PushLog;
