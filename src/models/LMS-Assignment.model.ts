import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Assignment Model
 * Coursework assignments with submission tracking
 */
export interface IAssignment {
  id: bigint;
  organizationId: bigint;
  courseId: bigint;
  lessonId?: bigint;
  assignmentTitle: string;
  description?: string;
  instructions?: string;
  dueDate: Date;
  totalPoints: number;
  passingPoints: number;
  assignmentType: 'Quiz' | 'Exercise' | 'Project' | 'Discussion' | 'Submission';
  allowLateSubmission: boolean;
  latePenalty?: number; // percentage
  maxAttempts?: number;
  attachmentUrl?: string;
  status: 'Draft' | 'Active' | 'Closed' | 'Archived';
  createdBy?: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Assignment extends Model<IAssignment> implements IAssignment {
  declare id: bigint;
  declare organizationId: bigint;
  declare courseId: bigint;
  declare lessonId?: bigint;
  declare assignmentTitle: string;
  declare description?: string;
  declare instructions?: string;
  declare dueDate: Date;
  declare totalPoints: number;
  declare passingPoints: number;
  declare assignmentType: 'Quiz' | 'Exercise' | 'Project' | 'Discussion' | 'Submission';
  declare allowLateSubmission: boolean;
  declare latePenalty?: number;
  declare maxAttempts?: number;
  declare attachmentUrl?: string;
  declare status: 'Draft' | 'Active' | 'Closed' | 'Archived';
  declare createdBy?: bigint;
  declare updatedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Assignment.init(
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
    courseId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Course',
    },
    lessonId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Lesson',
    },
    assignmentTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instructions: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    passingPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    assignmentType: {
      type: DataTypes.ENUM('Quiz', 'Exercise', 'Project', 'Discussion', 'Submission'),
      defaultValue: 'Exercise',
    },
    allowLateSubmission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    latePenalty: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Penalty percentage for late submission',
    },
    maxAttempts: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Active', 'Closed', 'Archived'),
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
    tableName: 'assignment',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'courseId'] },
      { fields: ['lessonId'] },
      { fields: ['dueDate'] },
      { fields: ['status'] },
      { fields: ['organizationId', 'status', 'dueDate'] },
    ],
  }
);

export default Assignment;
