import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Direct Message Model
 * One-to-one messaging between staff
 */
export interface IDirectMessage {
  id: bigint;
  organizationId: bigint;
  senderId: bigint;
  recipientId: bigint;
  messageText: string;
  messageType: 'Text' | 'File' | 'Image' | 'Voice';
  status: 'Sent' | 'Delivered' | 'Read';
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  parentMessageId?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAtSoft?: Date;
}

export class DirectMessage extends Model<IDirectMessage> implements IDirectMessage {
  declare id: bigint;
  declare organizationId: bigint;
  declare senderId: bigint;
  declare recipientId: bigint;
  declare messageText: string;
  declare messageType: 'Text' | 'File' | 'Image' | 'Voice';
  declare status: 'Sent' | 'Delivered' | 'Read';
  declare sentAt: Date;
  declare deliveredAt?: Date;
  declare readAt?: Date;
  declare isEdited: boolean;
  declare editedAt?: Date;
  declare isDeleted: boolean;
  declare deletedAt?: Date;
  declare parentMessageId?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAtSoft?: Date;
}

DirectMessage.init(
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
    senderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (sender)',
    },
    recipientId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (recipient)',
    },
    messageText: {
      type: DataTypes.LONGTEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM('Text', 'File', 'Image', 'Voice'),
      defaultValue: 'Text',
    },
    status: {
      type: DataTypes.ENUM('Sent', 'Delivered', 'Read'),
      defaultValue: 'Sent',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    parentMessageId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'For reply threads',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAtSoft: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'direct_message',
    timestamps: true,
    paranoid: false,
    indexes: [
      { fields: ['organizationId'] },
      { fields: ['senderId', 'recipientId'] },
      { fields: ['status'] },
      { fields: ['sentAt'] },
      { fields: ['organizationId', 'senderId', 'recipientId'] },
    ],
  }
);

export default DirectMessage;
