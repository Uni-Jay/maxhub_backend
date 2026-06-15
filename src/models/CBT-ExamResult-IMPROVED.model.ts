import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Result Model [IMPROVED - IMMUTABLE]
 * Consolidated exam results after grading
 * 
 * IMPROVEMENTS:
 * - Make immutable (timestamps: false, paranoid: false)
 * - Add createdBy for audit trail
 * - Remove updatedAt/deletedAt to enforce immutability
 * - Add resultFinalizedAt for compliance
 * - Add adminNotes field with permission gating
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
  resultFinalizedAt: Date; // NEW: Immutable after this date
  viewedAt?: Date;
  certificateEligible: boolean;
  resultDetails?: string;
  adminNotes?: string; // NEW: Admin-only notes
  createdBy: bigint; // NEW: Audit trail
  createdAt: Date;
  // NOTE: NO updatedAt, deletedAt - table is IMMUTABLE
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
  declare resultFinalizedAt: Date;
  declare viewedAt?: Date;
  declare certificateEligible: boolean;
  declare resultDetails?: string;
  declare adminNotes?: string;
  declare createdBy: bigint;
  declare createdAt: Date;
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
      comment: 'FK to StudentExamAttempt - IMMUTABLE',
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
    resultFinalizedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'NEW: Timestamp when result becomes immutable',
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
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'NEW: Admin-only notes (permission gated)',
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'NEW: Audit trail - who created this result',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'exam_result',
    paranoid: false, // IMPROVED: No soft delete
    timestamps: false, // IMPROVED: Only createdAt (immutable)
    indexes: [
      { fields: ['organizationId', 'examId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
      { fields: ['grade'] },
      { fields: ['resultDate'] },
      { fields: ['resultFinalizedAt'] },
      { fields: ['organizationId', 'studentId', 'examId'] },
    ],
  }
);

export default ExamResult;
