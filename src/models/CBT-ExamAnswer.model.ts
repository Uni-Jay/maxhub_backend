import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Answer Model
 * Student answers to exam questions with auto-grading
 */
export interface IExamAnswer {
  id: bigint;
  organizationId: bigint;
  examAttemptId: bigint;
  questionId: bigint;
  questionText: string;
  marksAllocated: number;
  studentAnswer?: string;
  isCorrect: boolean;
  marksObtained: number;
  autoGraded: boolean;
  manualGradedBy?: bigint;
  manualGradedAt?: Date;
  manualFeedback?: string;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ExamAnswer extends Model<IExamAnswer> implements IExamAnswer {
  declare id: bigint;
  declare organizationId: bigint;
  declare examAttemptId: bigint;
  declare questionId: bigint;
  declare questionText: string;
  declare marksAllocated: number;
  declare studentAnswer?: string;
  declare isCorrect: boolean;
  declare marksObtained: number;
  declare autoGraded: boolean;
  declare manualGradedBy?: bigint;
  declare manualGradedAt?: Date;
  declare manualFeedback?: string;
  declare sequence: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

ExamAnswer.init(
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
    examAttemptId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to StudentExamAttempt',
    },
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Question',
    },
    questionText: {
      type: DataTypes.LONGTEXT,
      allowNull: false,
    },
    marksAllocated: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    studentAnswer: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    marksObtained: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    autoGraded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    manualGradedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff (instructor)',
    },
    manualGradedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    manualFeedback: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    sequence: {
      type: DataTypes.INTEGER,
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
    tableName: 'exam_answer',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'examAttemptId'] },
      { fields: ['questionId'] },
      { fields: ['isCorrect'] },
      { fields: ['autoGraded'] },
      { fields: ['examAttemptId', 'questionId'] },
    ],
  }
);

export default ExamAnswer;
