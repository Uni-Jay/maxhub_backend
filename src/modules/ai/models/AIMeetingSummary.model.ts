import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AIMeetingSummaryAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  title: string;
  transcript: string;
  summary: string;
  actionItems: object[];
  keyDecisions: string[];
  nextSteps: string[];
  model: string;
  participants?: string[];
  deletedAt?: Date;
}

interface AIMeetingSummaryCreationAttributes
  extends Optional<AIMeetingSummaryAttributes, 'id' | 'uuid' | 'participants'> {}

export class AIMeetingSummary
  extends Model<AIMeetingSummaryAttributes, AIMeetingSummaryCreationAttributes>
  implements AIMeetingSummaryAttributes
{
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public title!: string;
  public transcript!: string;
  public summary!: string;
  public actionItems!: object[];
  public keyDecisions!: string[];
  public nextSteps!: string[];
  public model!: string;
  public participants?: string[];
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AIMeetingSummary {
    AIMeetingSummary.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        transcript: { type: DataTypes.TEXT('long'), allowNull: false },
        summary: { type: DataTypes.TEXT('long'), allowNull: false },
        actionItems: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
        keyDecisions: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
        nextSteps: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
        model: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'llama3' },
        participants: { type: DataTypes.JSON, allowNull: true },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        tableName: 'ai_meeting_summaries',
        timestamps: true,
        paranoid: true,
        underscored: false,
        indexes: [
          { fields: ['userId'], name: 'idx_ai_meeting_userId' },
        ],
      },
    );
    return AIMeetingSummary;
  }
}
