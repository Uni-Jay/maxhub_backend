import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Lesson Model
 * Individual lessons within a course module
 */
export interface ILesson {
  id: bigint;
  organizationId: bigint;
  courseId: bigint;
  courseModuleId?: bigint;
  lessonTitle: string;
  lessonNumber: number;
  description?: string;
  content?: string;
  duration: number; // in minutes
  sequence: number;
  status: 'Draft' | 'Published' | 'Archived';
  isPreview: boolean;
  createdBy?: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Lesson extends Model<ILesson> implements ILesson {
  declare id: bigint;
  declare organizationId: bigint;
  declare courseId: bigint;
  declare courseModuleId?: bigint;
  declare lessonTitle: string;
  declare lessonNumber: number;
  declare description?: string;
  declare content?: string;
  declare duration: number;
  declare sequence: number;
  declare status: 'Draft' | 'Published' | 'Archived';
  declare isPreview: boolean;
  declare createdBy?: bigint;
  declare updatedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Lesson.init(
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
    courseModuleId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to CourseModule for organization',
    },
    lessonTitle: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    lessonNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sequence: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Published', 'Archived'),
      defaultValue: 'Draft',
    },
    isPreview: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'lesson',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'courseId'] },
      { fields: ['courseModuleId'] },
      { fields: ['sequence'] },
      { fields: ['organizationId', 'courseId', 'status'] },
    ],
  }
);

export default Lesson;
