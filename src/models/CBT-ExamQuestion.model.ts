import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Question Model
 * Junction table for questions in an exam
 */
export interface IExamQuestion {
  id: bigint;
  organizationId: bigint;
  examId: bigint;
  questionId: bigint;
  sequence: number;
  marks: number;
  questionType: 'Multiple Choice' | 'True/False' | 'Short Answer' | 'Essay';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ExamQuestion extends Model<IExamQuestion> implements IExamQuestion {
  declare id: bigint;
  declare organizationId: bigint;
  declare examId: bigint;
  declare questionId: bigint;
  declare sequence: number;
  declare marks: number;
  declare questionType: 'Multiple Choice' | 'True/False' | 'Short Answer' | 'Essay';
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

ExamQuestion.init(
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
    examId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Exam',
    },
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Question',
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    questionType: {
      type: DataTypes.ENUM('Multiple Choice', 'True/False', 'Short Answer', 'Essay'),
      allowNull: false,
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
    tableName: 'exam_question',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'examId'] },
      { fields: ['questionId'] },
      { fields: ['sequence'] },
      {
        fields: ['examId', 'questionId'],
        unique: true,
        where: { deletedAt: null },
        name: 'uq_exam_question_unique',
      },
    ],
  }
);

export default ExamQuestion;
