import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Message Attachment Model
 * File attachments for messages
 */
export interface IMessageAttachment {
  id: bigint;
  organizationId: bigint;
  directMessageId?: bigint;
  chatMessageId?: bigint;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileExtension?: string;
  uploadedAt: Date;
  uploadedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class MessageAttachment extends Model<IMessageAttachment> implements IMessageAttachment {
  declare id: bigint;
  declare organizationId: bigint;
  declare directMessageId?: bigint;
  declare chatMessageId?: bigint;
  declare fileUrl: string;
  declare fileName: string;
  declare fileSize: number;
  declare fileType: string;
  declare fileExtension?: string;
  declare uploadedAt: Date;
  declare uploadedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

MessageAttachment.init(
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
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'File size in bytes',
    },
    fileType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fileExtension: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    uploadedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'message_attachment',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId'] },
      { fields: ['directMessageId'] },
      { fields: ['chatMessageId'] },
      { fields: ['fileType'] },
    ],
  }
);

export default MessageAttachment;
