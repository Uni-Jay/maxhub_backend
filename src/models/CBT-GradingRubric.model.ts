import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Grading Rubric Model [MISSING]
 * Define grading criteria for essay and short answer questions
 */
export interface IGradingRubric {
  id: bigint;
  organizationId: bigint;
  questionId: bigint;
  rubricName: string;
  totalPoints: number;
  description?: string;
  status: 'Active' | 'Inactive' | 'Archived';
  createdBy: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class GradingRubric extends Model<IGradingRubric> implements IGradingRubric {
  declare id: bigint;
  declare organizationId: bigint;
  declare questionId: bigint;
  declare rubricName: string;
  declare totalPoints: number;
  declare description?: string;
  declare status: 'Active' | 'Inactive' | 'Archived';
  declare createdBy: bigint;
  declare updatedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

GradingRubric.init(
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
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Question (Essay/ShortAnswer only)',
    },
    rubricName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Archived'),
      defaultValue: 'Active',
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
    tableName: 'grading_rubric',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'questionId'] },
      { fields: ['status'] },
    ],
  }
);

export default GradingRubric;
