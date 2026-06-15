import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Message Notification Model
 * User notifications for messages and mentions
 */
export interface IMessageNotification {
  id: bigint;
  organizationId: bigint;
  userId: bigint;
  notificationType: 'NewDirectMessage' | 'NewChatMessage' | 'Mention' | 'FileShared' | 'VoiceNote';
  notificationTitle: string;
  notificationBody?: string;
  sourceMessageId: bigint;
  sourceDirectMessageId?: bigint;
  sourceChatMessageId?: bigint;
  sourceUserId?: bigint;
  isRead: boolean;
  readAt?: Date;
  notificationAction?: string; // deep link URL
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class MessageNotification extends Model<IMessageNotification> implements IMessageNotification {
  declare id: bigint;
  declare organizationId: bigint;
  declare userId: bigint;
  declare notificationType: 'NewDirectMessage' | 'NewChatMessage' | 'Mention' | 'FileShared' | 'VoiceNote';
  declare notificationTitle: string;
  declare notificationBody?: string;
  declare sourceMessageId: bigint;
  declare sourceDirectMessageId?: bigint;
  declare sourceChatMessageId?: bigint;
  declare sourceUserId?: bigint;
  declare isRead: boolean;
  declare readAt?: Date;
  declare notificationAction?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

MessageNotification.init(
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
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (recipient)',
    },
    notificationType: {
      type: DataTypes.ENUM('NewDirectMessage', 'NewChatMessage', 'Mention', 'FileShared', 'VoiceNote'),
      allowNull: false,
    },
    notificationTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    notificationBody: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sourceMessageId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    sourceDirectMessageId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to DirectMessage if applicable',
    },
    sourceChatMessageId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to ChatMessage if applicable',
    },
    sourceUserId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff (sender)',
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notificationAction: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Deep link for navigation',
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
    tableName: 'message_notification',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'userId'] },
      { fields: ['notificationType'] },
      { fields: ['isRead'] },
      { fields: ['createdAt'] },
      { fields: ['organizationId', 'userId', 'isRead'] },
    ],
  }
);

export default MessageNotification;
