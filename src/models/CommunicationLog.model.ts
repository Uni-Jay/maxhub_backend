import { Model, DataTypes, Sequelize, Optional } from 'sequelize';

export interface CommunicationLogAttributes {
  id: bigint;
  uuid: string;
  type: 'Weekly' | 'Birthday' | 'Manual' | 'Scheduled';
  channel: 'Email' | 'SMS' | 'WhatsApp';
  recipientType: 'All' | 'Department' | 'Selected' | 'Country' | 'Status';
  recipientFilter?: string; // JSON - department IDs, country, status, etc.
  subject?: string;
  message: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  status: 'Pending' | 'Sending' | 'Completed' | 'Failed' | 'Partial';
  scheduledAt?: Date;
  sentAt?: Date;
  createdByUserId?: bigint;
  errorDetails?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommunicationLogCreationAttributes
  extends Optional<
    CommunicationLogAttributes,
    | 'id'
    | 'uuid'
    | 'recipientFilter'
    | 'subject'
    | 'totalRecipients'
    | 'successCount'
    | 'failureCount'
    | 'status'
    | 'scheduledAt'
    | 'sentAt'
    | 'createdByUserId'
    | 'errorDetails'
    | 'createdAt'
    | 'updatedAt'
  > {}

export class CommunicationLog
  extends Model<CommunicationLogAttributes, CommunicationLogCreationAttributes>
  implements CommunicationLogAttributes
{
  declare id: bigint;
  declare uuid: string;
  declare type: 'Weekly' | 'Birthday' | 'Manual' | 'Scheduled';
  declare channel: 'Email' | 'SMS' | 'WhatsApp';
  declare recipientType: 'All' | 'Department' | 'Selected' | 'Country' | 'Status';
  declare recipientFilter?: string;
  declare subject?: string;
  declare message: string;
  declare totalRecipients: number;
  declare successCount: number;
  declare failureCount: number;
  declare status: 'Pending' | 'Sending' | 'Completed' | 'Failed' | 'Partial';
  declare scheduledAt?: Date;
  declare sentAt?: Date;
  declare createdByUserId?: bigint;
  declare errorDetails?: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  static initModel(sequelize: Sequelize): void {
    CommunicationLog.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
        uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
        type: {
          type: DataTypes.ENUM('Weekly', 'Birthday', 'Manual', 'Scheduled'),
          allowNull: false,
        },
        channel: { type: DataTypes.ENUM('Email', 'SMS', 'WhatsApp'), allowNull: false },
        recipientType: {
          type: DataTypes.ENUM('All', 'Department', 'Selected', 'Country', 'Status'),
          defaultValue: 'All',
        },
        recipientFilter: { type: DataTypes.TEXT, allowNull: true },
        subject: { type: DataTypes.STRING(500), allowNull: true },
        message: { type: DataTypes.TEXT, allowNull: false },
        totalRecipients: { type: DataTypes.INTEGER, defaultValue: 0 },
        successCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        failureCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: {
          type: DataTypes.ENUM('Pending', 'Sending', 'Completed', 'Failed', 'Partial'),
          defaultValue: 'Pending',
        },
        scheduledAt: { type: DataTypes.DATE, allowNull: true },
        sentAt: { type: DataTypes.DATE, allowNull: true },
        createdByUserId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
        errorDetails: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        modelName: 'CommunicationLog',
        tableName: 'communication_logs',
        timestamps: true,
      }
    );
  }
}

export default CommunicationLog;
