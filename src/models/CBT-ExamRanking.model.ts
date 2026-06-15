import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Ranking Model
 * Leaderboard rankings for exams
 */
export interface IExamRanking {
  id: bigint;
  organizationId: bigint;
  examId: bigint;
  studentId: bigint;
  studentName: string;
  departmentId?: bigint;
  rankPosition: number;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  attemptDate: Date;
  passStatus: 'Pass' | 'Fail';
  updatedAt: Date;
}

export class ExamRanking extends Model<IExamRanking> implements IExamRanking {
  declare id: bigint;
  declare organizationId: bigint;
  declare examId: bigint;
  declare studentId: bigint;
  declare studentName: string;
  declare departmentId?: bigint;
  declare rankPosition: number;
  declare totalMarks: number;
  declare obtainedMarks: number;
  declare percentage: number;
  declare grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  declare attemptDate: Date;
  declare passStatus: 'Pass' | 'Fail';
  declare updatedAt: Date;
}

ExamRanking.init(
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
    studentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (student)',
    },
    studentName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Department',
    },
    rankPosition: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    attemptDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    passStatus: {
      type: DataTypes.ENUM('Pass', 'Fail'),
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'exam_ranking',
    timestamps: false,
    indexes: [
      { fields: ['organizationId', 'examId'] },
      { fields: ['rankPosition'] },
      { fields: ['percentage'] },
      { fields: ['departmentId'] },
    ],
  }
);

export default ExamRanking;
