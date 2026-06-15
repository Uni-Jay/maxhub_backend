import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

interface SurveyAttributes {
  id: bigint;
  uuid: string;
  surveyCode: string;
  surveyTitle: string;
  description?: string;
  surveyType: 'Employee Satisfaction' | 'Customer Feedback' | 'Exit Interview' | 'Training Feedback' | 'General' | 'Other';
  status: 'Draft' | 'Active' | 'Closed' | 'Archived';
  startDate: Date;
  endDate: Date;
  createdById: bigint;
  targetAudience?: string;
  responseCount?: number;
  deletedAt?: Date;
}

interface SurveyCreationAttributes extends Optional<SurveyAttributes, 'id' | 'uuid'> {}

export class Survey extends Model<SurveyAttributes, SurveyCreationAttributes>
  implements SurveyAttributes {
  public id!: bigint;
  public uuid!: string;
  public surveyCode!: string;
  public surveyTitle!: string;
  public description?: string;
  public surveyType!: 'Employee Satisfaction' | 'Customer Feedback' | 'Exit Interview' | 'Training Feedback' | 'General' | 'Other';
  public status!: 'Draft' | 'Active' | 'Closed' | 'Archived';
  public startDate!: Date;
  public endDate!: Date;
  public createdById!: bigint;
  public targetAudience?: string;
  public responseCount?: number;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof Survey {
    Survey.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        surveyCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Survey code' },
        surveyTitle: { type: DataTypes.STRING(200), allowNull: false, comment: 'Survey title' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        surveyType: { type: DataTypes.ENUM('Employee Satisfaction', 'Customer Feedback', 'Exit Interview', 'Training Feedback', 'General', 'Other'), allowNull: false },
        status: { type: DataTypes.ENUM('Draft', 'Active', 'Closed', 'Archived'), defaultValue: 'Draft' },
        startDate: { type: DataTypes.DATE, allowNull: false, comment: 'Start date' },
        endDate: { type: DataTypes.DATE, allowNull: false, comment: 'End date' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        targetAudience: { type: DataTypes.STRING(200), allowNull: true, comment: 'Target audience' },
        responseCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0, comment: 'Response count' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'surveys', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['surveyCode'], name: 'idx_surveys_surveyCode' },
          { fields: ['surveyType'], name: 'idx_surveys_surveyType' },
          { fields: ['status'], name: 'idx_surveys_status' },
          { fields: ['startDate'], name: 'idx_surveys_startDate' },
          { fields: ['createdById'], name: 'idx_surveys_createdById' },
          { fields: ['uuid'], name: 'idx_surveys_uuid' },
        ],
        comment: 'Surveys'
      }
    );
    return Survey;
  }
}
