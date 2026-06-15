import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface GoalAttributes {
  id: bigint;
  uuid: string;
  goalCode: string;
  staffId: bigint;
  goalTitle: string;
  description?: string;
  objectiveCategory: string;
  targetValue?: number;
  actualValue?: number;
  progress: number;
  status: 'NotStarted' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled';
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  comments?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface GoalCreationAttributes extends Optional<GoalAttributes, 'id' | 'uuid'> {}

export class Goal extends Model<GoalAttributes, GoalCreationAttributes>
  implements GoalAttributes {
  public id!: bigint;
  public uuid!: string;
  public goalCode!: string;
  public staffId!: bigint;
  public goalTitle!: string;
  public description?: string;
  public objectiveCategory!: string;
  public targetValue?: number;
  public actualValue?: number;
  public progress!: number;
  public status!: 'NotStarted' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled';
  public startDate!: Date;
  public targetDate!: Date;
  public completedDate?: Date;
  public comments?: string;
  public createdById!: bigint;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Goal {
    Goal.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        goalCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Goal code' },
        staffId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
        goalTitle: { type: DataTypes.STRING(200), allowNull: false, comment: 'Goal title' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        objectiveCategory: { type: DataTypes.STRING(100), allowNull: false, comment: 'Category' },
        targetValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: 'Target value' },
        actualValue: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: 'Actual value' },
        progress: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0, comment: 'Progress (%)', validate: { min: 0, max: 100 } },
        status: { type: DataTypes.ENUM('NotStarted', 'InProgress', 'Completed', 'OnHold', 'Cancelled'), defaultValue: 'NotStarted' },
        startDate: { type: DataTypes.DATE, allowNull: false, comment: 'Start date' },
        targetDate: { type: DataTypes.DATE, allowNull: false, comment: 'Target date' },
        completedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Completion date' },
        comments: { type: DataTypes.TEXT, allowNull: true, comment: 'Comments' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'goals', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['goalCode'], name: 'idx_goals_goalCode' },
          { fields: ['staffId'], name: 'idx_goals_staffId' },
          { fields: ['status'], name: 'idx_goals_status' },
          { fields: ['targetDate'], name: 'idx_goals_targetDate' },
          { fields: ['uuid'], name: 'idx_goals_uuid' },
        ],
        comment: 'Staff goals and objectives'
      }
    );
    return Goal;
  }
}
