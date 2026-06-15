import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 21: Messaging - Chat Participant Model [CRITICAL - MISSING]
 * Track membership and roles in department chats
 */
export interface IChatParticipant {
  id: bigint;
  organizationId: bigint;
  departmentChatId: bigint;
  staffId: bigint;
  role: 'Admin' | 'Moderator' | 'Member';
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  muteNotifications: boolean;
  lastReadAt?: Date;
  unreadCount: number; // NEW: Denormalized for performance
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ChatParticipant extends Model<IChatParticipant> implements IChatParticipant {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentChatId: bigint;
  declare staffId: bigint;
  declare role: 'Admin' | 'Moderator' | 'Member';
  declare joinedAt: Date;
  declare leftAt?: Date;
  declare isMuted: boolean;
  declare muteNotifications: boolean;
  declare lastReadAt?: Date;
  declare unreadCount: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

ChatParticipant.init(
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
    staffId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    role: {
      type: DataTypes.ENUM('Admin', 'Moderator', 'Member'),
      defaultValue: 'Member',
      comment: 'NEW: Role-based permissions in chat',
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    leftAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isMuted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    muteNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastReadAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'NEW: Denormalized for O(1) inbox queries',
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
    tableName: 'chat_participant',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'departmentChatId'] },
      { fields: ['staffId'] },
      { fields: ['role'] },
      {
        fields: ['departmentChatId', 'staffId'],
        unique: true,
        where: { deletedAt: null, leftAt: null },
        name: 'uq_active_participant',
      },
    ],
  }
);

export default ChatParticipant;
