import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Result Model
 * Consolidated exam results after grading
 */
export interface IExamResult {
  id: bigint;
  organizationId: bigint;
  examAttemptId: bigint;
  examId: bigint;
  studentId: bigint;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  status: 'Pass' | 'Fail';
  resultDate: Date;
  viewedAt?: Date;
  certificateEligible: boolean;
  resultDetails?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ExamResult extends Model<IExamResult> implements IExamResult {
  declare id: bigint;
  declare organizationId: bigint;
  declare examAttemptId: bigint;
  declare examId: bigint;
  declare studentId: bigint;
  declare totalMarks: number;
  declare obtainedMarks: number;
  declare percentage: number;
  declare grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  declare status: 'Pass' | 'Fail';
  declare resultDate: Date;
  declare viewedAt?: Date;
  declare certificateEligible: boolean;
  declare resultDetails?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

ExamResult.init(
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
    examId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Exam',
    },
    studentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (student)',
    },
    totalMarks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    obtainedMarks: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    grade: {
      type: DataTypes.ENUM('A+', 'A', 'B+', 'B', 'C', 'D', 'F'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Pass', 'Fail'),
      allowNull: false,
    },
    resultDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    viewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    certificateEligible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    resultDetails: {
      type: DataTypes.TEXT,
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
    tableName: 'exam_result',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'examId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
      { fields: ['grade'] },
      { fields: ['resultDate'] },
      { fields: ['organizationId', 'studentId', 'examId'] },
    ],
  }
);

export default ExamResult;
