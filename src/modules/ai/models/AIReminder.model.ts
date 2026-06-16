import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface AIReminderAttributes {
  id: bigint;
  uuid: string;
  userId: bigint;
  type: string;
  title: string;
  message: string;
  urgency: 'critical' | 'high' | 'normal';
  suggestedSendTime?: string;
  context: object;
  dueDate?: Date;
  sent: boolean;
  sentAt?: Date;
  model: string;
  deletedAt?: Date;
}

interface AIReminderCreationAttributes
  extends Optional<AIReminderAttributes, 'id' | 'uuid' | 'sent' | 'sentAt' | 'dueDate' | 'suggestedSendTime'> {}

export class AIReminder
  extends Model<AIReminderAttributes, AIReminderCreationAttributes>
  implements AIReminderAttributes
{
  public id!: bigint;
  public uuid!: string;
  public userId!: bigint;
  public type!: string;
  public title!: string;
  public message!: string;
  public urgency!: 'critical' | 'high' | 'normal';
  public suggestedSendTime?: string;
  public context!: object;
  public dueDate?: Date;
  public sent!: boolean;
  public sentAt?: Date;
  public model!: string;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof AIReminder {
    AIReminder.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true },
        userId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        type: { type: DataTypes.STRING(50), allowNull: false },
        title: { type: DataTypes.STRING(255), allowNull: false },
        message: { type: DataTypes.TEXT, allowNull: false },
        urgency: {
          type: DataTypes.ENUM('critical', 'high', 'normal'),
          allowNull: false,
          defaultValue: 'normal',
        },
        suggestedSendTime: { type: DataTypes.STRING(100), allowNull: true },
        context: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
        dueDate: { type: DataTypes.DATE, allowNull: true },
        sent: { type: DataTypes.BOOLEAN, defaultValue: false },
        sentAt: { type: DataTypes.DATE, allowNull: true },
        model: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'llama3' },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        tableName: 'ai_reminders',
        timestamps: true,
        paranoid: true,
        underscored: false,
        indexes: [
          { fields: ['userId'], name: 'idx_ai_reminders_userId' },
          { fields: ['sent'], name: 'idx_ai_reminders_sent' },
          { fields: ['urgency'], name: 'idx_ai_reminders_urgency' },
        ],
      },
    );
    return AIReminder;
  }
}
