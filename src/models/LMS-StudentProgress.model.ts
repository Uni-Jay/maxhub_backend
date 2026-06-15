import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Student Progress Model
 * Track individual lesson completion and progress
 */
export interface IStudentProgress {
  id: bigint;
  organizationId: bigint;
  studentId: bigint;
  courseId: bigint;
  lessonId: bigint;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Skipped';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number; // in seconds
  videoProgress?: number; // 0-100 for video completion
  viewed: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class StudentProgress extends Model<IStudentProgress> implements IStudentProgress {
  declare id: bigint;
  declare organizationId: bigint;
  declare studentId: bigint;
  declare courseId: bigint;
  declare lessonId: bigint;
  declare status: 'Not Started' | 'In Progress' | 'Completed' | 'Skipped';
  declare startedAt?: Date;
  declare completedAt?: Date;
  declare timeSpent: number;
  declare videoProgress?: number;
  declare viewed: boolean;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

StudentProgress.init(
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
    studentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (student)',
    },
    courseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Course',
    },
    lessonId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Lesson',
    },
    status: {
      type: DataTypes.ENUM('Not Started', 'In Progress', 'Completed', 'Skipped'),
      defaultValue: 'Not Started',
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Time in seconds',
    },
    videoProgress: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Video completion percentage',
    },
    viewed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notes: {
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
    tableName: 'student_progress',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'studentId', 'courseId'] },
      { fields: ['lessonId'] },
      { fields: ['status'] },
      {
        fields: ['studentId', 'lessonId'],
        unique: true,
        where: { deletedAt: null },
        name: 'uq_student_lesson_progress',
      },
    ],
  }
);

export default StudentProgress;
