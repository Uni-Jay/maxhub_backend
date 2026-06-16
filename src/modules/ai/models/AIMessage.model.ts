import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AIMessageAttributes {
  id: bigint;
  uuid: string;
  conversationId: bigint;
  role: 'system' | 'user' | 'assistant';
  content: string;
  tokensUsed?: number;
}

interface AIMessageCreationAttributes extends Optional<AIMessageAttributes, 'id' | 'uuid' | 'tokensUsed'> {}

export class AIMessage
  extends Model<AIMessageAttributes, AIMessageCreationAttributes>
  implements AIMessageAttributes
{
  public id!: bigint;
  public uuid!: string;
  public conversationId!: bigint;
  public role!: 'system' | 'user' | 'assistant';
  public content!: string;
  public tokensUsed?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AIMessage {
    AIMessage.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
        conversationId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        role: {
          type: DataTypes.ENUM('system', 'user', 'assistant'),
          allowNull: false,
        },
        content: { type: DataTypes.TEXT('long'), allowNull: false },
        tokensUsed: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      },
      {
        sequelize,
        tableName: 'ai_messages',
        timestamps: true,
        underscored: false,
        indexes: [
          { fields: ['conversationId'], name: 'idx_ai_messages_conversationId' },
        ],
      },
    );
    return AIMessage;
  }
}
