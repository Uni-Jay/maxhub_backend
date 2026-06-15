import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Student Exam Attempt Model
 * Track individual exam attempts by students
 */
export interface IStudentExamAttempt {
  id: bigint;
  organizationId: bigint;
  examId: bigint;
  studentId: bigint;
  attemptNumber: number;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number; // in seconds
  status: 'InProgress' | 'Submitted' | 'Graded' | 'Abandoned';
  isSubmitted: boolean;
  submittedAt?: Date;
  totalQuestions: number;
  questionsAnswered: number;
  questionsSkipped: number;
  marksObtained?: number;
  totalMarks: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class StudentExamAttempt
  extends Model<IStudentExamAttempt>
  implements IStudentExamAttempt
{
  declare id: bigint;
  declare organizationId: bigint;
  declare examId: bigint;
  declare studentId: bigint;
  declare attemptNumber: number;
  declare startTime: Date;
  declare endTime?: Date;
  declare timeSpent?: number;
  declare status: 'InProgress' | 'Submitted' | 'Graded' | 'Abandoned';
  declare isSubmitted: boolean;
  declare submittedAt?: Date;
  declare totalQuestions: number;
  declare questionsAnswered: number;
  declare questionsSkipped: number;
  declare marksObtained?: number;
  declare totalMarks: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

StudentExamAttempt.init(
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
    attemptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time in seconds',
    },
    status: {
      type: DataTypes.ENUM('InProgress', 'Submitted', 'Graded', 'Abandoned'),
      defaultValue: 'InProgress',
    },
    isSubmitted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    questionsAnswered: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    questionsSkipped: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    marksObtained: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    totalMarks: {
      type: DataTypes.DECIMAL(5, 2),
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
    tableName: 'student_exam_attempt',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'examId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
      { fields: ['startTime'] },
      { fields: ['organizationId', 'studentId', 'examId'] },
    ],
  }
);

export default StudentExamAttempt;
