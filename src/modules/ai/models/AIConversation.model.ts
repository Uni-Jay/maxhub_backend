import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AIConversationAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  title: string;
  model: string;
  feature: 'chat' | 'report' | 'summarize' | 'email' | 'tasks' | 'reminder';
  messageCount: number;
  deletedAt?: Date;
}

interface AIConversationCreationAttributes
  extends Optional<AIConversationAttributes, 'id' | 'uuid' | 'messageCount'> {}

export class AIConversation
  extends Model<AIConversationAttributes, AIConversationCreationAttributes>
  implements AIConversationAttributes
{
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public title!: string;
  public model!: string;
  public feature!: 'chat' | 'report' | 'summarize' | 'email' | 'tasks' | 'reminder';
  public messageCount!: number;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AIConversation {
    AIConversation.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'New Conversation' },
        model: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'llama3' },
        feature: {
          type: DataTypes.ENUM('chat', 'report', 'summarize', 'email', 'tasks', 'reminder'),
          allowNull: false,
          defaultValue: 'chat',
        },
        messageCount: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        tableName: 'ai_conversations',
        timestamps: true,
        paranoid: true,
        underscored: false,
        indexes: [
          { fields: ['userId'], name: 'idx_ai_conversations_userId' },
          { fields: ['feature'], name: 'idx_ai_conversations_feature' },
        ],
      },
    );
    return AIConversation;
  }
}
