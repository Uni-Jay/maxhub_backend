import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Chat Message Model
 * Messages in department chats
 */
export interface IChatMessage {
  id: bigint;
  organizationId: bigint;
  departmentChatId: bigint;
  senderId: bigint;
  messageText: string;
  messageType: 'Text' | 'File' | 'Image' | 'Video' | 'VoiceNote';
  status: 'Sent' | 'Delivered' | 'Read';
  sentAt: Date;
  isEdited: boolean;
  editedAt?: Date;
  editedBy?: bigint;
  readByCount: number;
  mentionedUsers?: string; // JSON array of mentioned user IDs
  parentMessageId?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ChatMessage extends Model<IChatMessage> implements IChatMessage {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentChatId: bigint;
  declare senderId: bigint;
  declare messageText: string;
  declare messageType: 'Text' | 'File' | 'Image' | 'Video' | 'VoiceNote';
  declare status: 'Sent' | 'Delivered' | 'Read';
  declare sentAt: Date;
  declare isEdited: boolean;
  declare editedAt?: Date;
  declare editedBy?: bigint;
  declare readByCount: number;
  declare mentionedUsers?: string;
  declare parentMessageId?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

ChatMessage.init(
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
    departmentChatId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to DepartmentChat',
    },
    senderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    messageText: {
      type: DataTypes.LONGTEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM('Text', 'File', 'Image', 'Video', 'VoiceNote'),
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
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    editedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    readByCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    mentionedUsers: {
      type: DataTypes.JSON,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'chat_message',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'departmentChatId'] },
      { fields: ['senderId'] },
      { fields: ['status'] },
      { fields: ['sentAt'] },
      { fields: ['messageType'] },
    ],
  }
);

export default ChatMessage;
