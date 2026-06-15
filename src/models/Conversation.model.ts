import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ConversationAttributes {
  id: bigint;
  uuid: string;
  conversationCode: string;
  title: string;
  conversationType: 'Direct' | 'Group' | 'Team' | 'Channel';
  createdById: bigint;
  isArchived: boolean;
  lastMessageAt?: Date;
  deletedAt?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'uuid'> {}

export class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes>
  implements ConversationAttributes {
  public id!: bigint;
  public uuid!: string;
  public conversationCode!: string;
  public title!: string;
  public conversationType!: 'Direct' | 'Group' | 'Team' | 'Channel';
  public createdById!: bigint;
  public isArchived!: boolean;
  public lastMessageAt?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Conversation {
    Conversation.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        conversationCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Conversation code' },
        title: { type: DataTypes.STRING(200), allowNull: false, comment: 'Conversation title' },
        conversationType: { type: DataTypes.ENUM('Direct', 'Group', 'Team', 'Channel'), allowNull: false },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        isArchived: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is archived' },
        lastMessageAt: { type: DataTypes.DATE, allowNull: true, comment: 'Last message time' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'conversations', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['conversationCode'], name: 'idx_conversations_conversationCode' },
          { fields: ['createdById'], name: 'idx_conversations_createdById' },
          { fields: ['conversationType'], name: 'idx_conversations_conversationType' },
          { fields: ['isArchived'], name: 'idx_conversations_isArchived' },
          { fields: ['lastMessageAt'], name: 'idx_conversations_lastMessageAt' },
          { fields: ['uuid'], name: 'idx_conversations_uuid' },
        ],
        comment: 'Conversations'
      }
    );
    return Conversation;
  }
}
