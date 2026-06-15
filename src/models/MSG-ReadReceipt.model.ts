import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Read Receipt Model
 * Message read status tracking
 */
export interface IReadReceipt {
  id: bigint;
  organizationId: bigint;
  directMessageId?: bigint;
  chatMessageId?: bigint;
  readBy: bigint;
  readAt: Date;
  readFrom: 'Web' | 'Mobile' | 'Desktop' | 'API';
  deviceInfo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ReadReceipt extends Model<IReadReceipt> implements IReadReceipt {
  declare id: bigint;
  declare organizationId: bigint;
  declare directMessageId?: bigint;
  declare chatMessageId?: bigint;
  declare readBy: bigint;
  declare readAt: Date;
  declare readFrom: 'Web' | 'Mobile' | 'Desktop' | 'API';
  declare deviceInfo?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ReadReceipt.init(
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
    directMessageId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to DirectMessage',
    },
    chatMessageId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to ChatMessage',
    },
    readBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    readFrom: {
      type: DataTypes.ENUM('Web', 'Mobile', 'Desktop', 'API'),
      defaultValue: 'Web',
    },
    deviceInfo: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'read_receipt',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['organizationId'] },
      { fields: ['directMessageId'] },
      { fields: ['chatMessageId'] },
      { fields: ['readBy'] },
      { fields: ['readAt'] },
    ],
  }
);

export default ReadReceipt;
