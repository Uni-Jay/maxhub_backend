import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 20: CBT Examination - Exam Model
 * Exam/Quiz definition with timing and grading rules
 */
export interface IExam {
  id: bigint;
  organizationId: bigint;
  examCode: string;
  examTitle: string;
  description?: string;
  examType: 'Quiz' | 'Midterm' | 'FinalExam' | 'Assessment' | 'PreTest' | 'PostTest';
  totalQuestions: number;
  totalPoints: number;
  passingScore: number;
  duration: number; // in minutes
  shuffleQuestions: boolean;
  randomizeOptions: boolean;
  showCorrectAnswers: boolean;
  allowReview: boolean;
  maxAttempts?: number;
  courseId?: bigint;
  status: 'Draft' | 'Published' | 'Active' | 'Closed' | 'Archived';
  startDateTime?: Date;
  endDateTime?: Date;
  createdBy?: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Exam extends Model<IExam> implements IExam {
  declare id: bigint;
  declare organizationId: bigint;
  declare examCode: string;
  declare examTitle: string;
  declare description?: string;
  declare examType: 'Quiz' | 'Midterm' | 'FinalExam' | 'Assessment' | 'PreTest' | 'PostTest';
  declare totalQuestions: number;
  declare totalPoints: number;
  declare passingScore: number;
  declare duration: number;
  declare shuffleQuestions: boolean;
  declare randomizeOptions: boolean;
  declare showCorrectAnswers: boolean;
  declare allowReview: boolean;
  declare maxAttempts?: number;
  declare courseId?: bigint;
  declare status: 'Draft' | 'Published' | 'Active' | 'Closed' | 'Archived';
  declare startDateTime?: Date;
  declare endDateTime?: Date;
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
      { fields: ['organizationId', 'status'] },
      { fields: ['examCode'] },
      { fields: ['courseId'] },
      { fields: ['startDateTime', 'endDateTime'] },
      { fields: ['organizationId', 'examType'] },
    ],
  }
);

export default Exam;
