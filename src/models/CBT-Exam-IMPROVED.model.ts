import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Model [IMPROVED]
 * Exam/Quiz definition with timing and grading rules
 * 
 * IMPROVEMENTS:
 * - Add departmentId for RBAC enforcement
 * - Add examSecurityEnabled flag
 * - Add proctorRequired field
 * - Add shuffleQuestionsPerStudent for security
 * - Improve indexes for department-based queries
 */
export interface IExam {
  id: bigint;
  organizationId: bigint;
  departmentId?: bigint; // NEW: RBAC filtering
  examCode: string;
  examTitle: string;
  description?: string;
  examType: 'Quiz' | 'Midterm' | 'FinalExam' | 'Assessment' | 'PreTest' | 'PostTest';
  totalQuestions: number;
  totalPoints: number;
  passingScore: number;
  duration: number; // in minutes
  shuffleQuestions: boolean;
  shuffleQuestionsPerStudent: boolean; // NEW: Each student gets different order
  randomizeOptions: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  maxAttempts?: number;
  courseId?: bigint;
  status: 'Draft' | 'Published' | 'Active' | 'Closed' | 'Archived';
  startDateTime?: Date;
  endDateTime?: Date;
  examSecurityEnabled: boolean; // NEW: Enable cheating detection
  proctorRequired: boolean; // NEW: Require online proctor
  createdBy?: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Exam extends Model<IExam> implements IExam {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId?: bigint;
  declare examCode: string;
  declare examTitle: string;
  declare description?: string;
  declare examType: 'Quiz' | 'Midterm' | 'FinalExam' | 'Assessment' | 'PreTest' | 'PostTest';
  declare totalQuestions: number;
  declare totalPoints: number;
  declare passingScore: number;
  declare duration: number;
  declare shuffleQuestions: boolean;
  declare shuffleQuestionsPerStudent: boolean;
  declare randomizeOptions: boolean;
  declare showCorrectAnswers: boolean;
  declare allowReview: boolean;
  declare maxAttempts?: number;
  declare courseId?: bigint;
  declare status: 'Draft' | 'Published' | 'Active' | 'Closed' | 'Archived';
  declare startDateTime?: Date;
  declare endDateTime?: Date;
  declare examSecurityEnabled: boolean;
  declare proctorRequired: boolean;
  declare createdBy?: bigint;
  declare updatedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Exam.init(
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
    departmentId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'NEW: FK to Department for RBAC enforcement',
    },
    examCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    examTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    examType: {
      type: DataTypes.ENUM('Quiz', 'Midterm', 'FinalExam', 'Assessment', 'PreTest', 'PostTest'),
      defaultValue: 'Quiz',
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalPoints: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    passingScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Duration in minutes',
    },
    shuffleQuestions: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    shuffleQuestionsPerStudent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'NEW: Each student gets randomized question order',
    },
    randomizeOptions: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    showCorrectAnswers: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    allowReview: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    courseId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Course',
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Published', 'Active', 'Closed', 'Archived'),
      defaultValue: 'Draft',
    },
    startDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    examSecurityEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'NEW: Enable tab switch detection, IP monitoring, etc.',
    },
    proctorRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'NEW: Exam requires online proctor',
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
    tableName: 'exam',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'departmentId', 'status'] },
      { fields: ['examCode'] },
      { fields: ['courseId'] },
      { fields: ['startDateTime', 'endDateTime'] },
      { fields: ['organizationId', 'examType'] },
      // NEW: Indexes for department queries
      { fields: ['departmentId', 'status', 'startDateTime'] },
    ],
  }
);

export default Exam;
