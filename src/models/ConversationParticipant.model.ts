import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface ConversationParticipantAttributes {
  id: bigint;
  uuid: string;
  conversationId: bigint;
  userId: bigint;
  role: 'Admin' | 'Member' | 'Moderator' | 'Viewer';
  joinedAt: Date;
  lastSeenAt?: Date;
  isMuted: boolean;
  deletedAt?: Date;
}

interface ConversationParticipantCreationAttributes extends Optional<ConversationParticipantAttributes, 'id' | 'uuid'> {}

export class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes>
  implements ConversationParticipantAttributes {
  public id!: bigint;
  public uuid!: string;
  public conversationId!: bigint;
  public userId!: bigint;
  public role!: 'Admin' | 'Member' | 'Moderator' | 'Viewer';
  public joinedAt!: Date;
  public lastSeenAt?: Date;
  public isMuted!: boolean;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof ConversationParticipant {
    ConversationParticipant.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        conversationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Conversation ID' },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User ID' },
        role: { type: DataTypes.ENUM('Admin', 'Member', 'Moderator', 'Viewer'), defaultValue: 'Member' },
        joinedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, comment: 'Join date' },
        lastSeenAt: { type: DataTypes.DATE, allowNull: true, comment: 'Last activity' },
        isMuted: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: 'Is muted' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'conversation_participants', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['conversationId'], name: 'idx_conversation_participants_conversationId' },
          { fields: ['userId'], name: 'idx_conversation_participants_userId' },
          { fields: ['role'], name: 'idx_conversation_participants_role' },
          { fields: ['conversationId', 'userId'], name: 'idx_conversation_participants_conversation_user' },
          { fields: ['uuid'], name: 'idx_conversation_participants_uuid' },
        ],
        comment: 'Conversation participants'
      }
    );
    return ConversationParticipant;
  }
}
