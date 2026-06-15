import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Question Model
 * Question bank for computer-based testing
 */
export interface IQuestion {
  id: bigint;
  organizationId: bigint;
  questionBankId?: bigint;
  questionText: string;
  questionType: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  points: number;
  correctAnswer?: string;
  explanation?: string;
  imageUrl?: string;
  timeLimit?: number; // in seconds
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  createdBy?: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Question extends Model<IQuestion> implements IQuestion {
  declare id: bigint;
  declare organizationId: bigint;
  declare questionBankId?: bigint;
  declare questionText: string;
  declare questionType: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching';
  declare difficulty: 'Easy' | 'Medium' | 'Hard';
  declare category: string;
  declare points: number;
  declare correctAnswer?: string;
  declare explanation?: string;
  declare imageUrl?: string;
  declare timeLimit?: number;
  declare status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  declare createdBy?: bigint;
  declare updatedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Question.init(
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
    questionBankId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to QuestionBank',
    },
    questionText: {
      type: DataTypes.LONGTEXT,
      allowNull: false,
    },
    questionType: {
      type: DataTypes.ENUM('MultipleChoice', 'TrueFalse', 'ShortAnswer', 'Essay', 'Matching'),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
      defaultValue: 'Medium',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    points: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    correctAnswer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    explanation: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time in seconds for this question',
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Active', 'Inactive', 'Archived'),
      defaultValue: 'Draft',
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
    tableName: 'question',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['questionBankId'] },
      { fields: ['category'] },
      { fields: ['difficulty'] },
      { fields: ['questionType'] },
    ],
  }
);

export default Question;
