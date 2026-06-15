import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Course Model [CRITICAL - MISSING]
 * Master course definition and configuration
 */
export interface ICourse {
  id: bigint;
  organizationId: bigint;
  departmentId: bigint; // NEW: RBAC filtering
  courseCode: string;
  courseName: string;
  description?: string;
  instructorId: bigint;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: number; // in hours
  maxStudents?: number;
  prerequisiteStatus: 'None' | 'Required' | 'Recommended'; // NEW: Prerequisite support
  credits: number;
  status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  enrollmentStartDate?: Date;
  enrollmentEndDate?: Date;
  courseStartDate?: Date;
  courseEndDate?: Date;
  isPublic: boolean;
  thumbnailUrl?: string;
  createdBy: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Course extends Model<ICourse> implements ICourse {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId: bigint;
  declare courseCode: string;
  declare courseName: string;
  declare description?: string;
  declare instructorId: bigint;
  declare category: string;
  declare difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  declare duration: number;
  declare maxStudents?: number;
  declare prerequisiteStatus: 'None' | 'Required' | 'Recommended';
  declare credits: number;
  declare status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
  declare enrollmentStartDate?: Date;
  declare enrollmentEndDate?: Date;
  declare courseStartDate?: Date;
  declare courseEndDate?: Date;
  declare isPublic: boolean;
  declare thumbnailUrl?: string;
  declare createdBy: bigint;
  declare updatedBy?: bigint;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Course.init(
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
      allowNull: false,
      comment: 'NEW: FK to Department for RBAC filtering',
    },
    courseCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    courseName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instructorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    difficulty: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
      defaultValue: 'Intermediate',
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Course duration in hours',
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    prerequisiteStatus: {
      type: DataTypes.ENUM('None', 'Required', 'Recommended'),
      defaultValue: 'None',
      comment: 'NEW: Supports course prerequisites',
    },
    credits: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Active', 'Inactive', 'Archived'),
      defaultValue: 'Draft',
    },
    enrollmentStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    enrollmentEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    courseStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    courseEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: false,
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
    tableName: 'course',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'departmentId', 'status'] },
      { fields: ['courseCode'] },
      { fields: ['instructorId'] },
      { fields: ['category'] },
      { fields: ['status'] },
    ],
  }
);

export default Course;
