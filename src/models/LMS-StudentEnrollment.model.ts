import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Student Enrollment Model
 * Track student enrollment in courses
 */
export interface IStudentEnrollment {
  id: bigint;
  organizationId: bigint;
  courseId: bigint;
  studentId: bigint;
  enrollmentDate: Date;
  completionDate?: Date;
  status: 'Active' | 'Completed' | 'Dropped' | 'Suspended';
  progress: number; // 0-100 percentage
  totalScore?: number;
  certificateId?: bigint;
  certificateEarned: boolean;
  certificateDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class StudentEnrollment extends Model<IStudentEnrollment> implements IStudentEnrollment {
  declare id: bigint;
  declare organizationId: bigint;
  declare courseId: bigint;
  declare studentId: bigint;
  declare enrollmentDate: Date;
  declare completionDate?: Date;
  declare status: 'Active' | 'Completed' | 'Dropped' | 'Suspended';
  declare progress: number;
  declare totalScore?: number;
  declare certificateId?: bigint;
  declare certificateEarned: boolean;
  declare certificateDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

StudentEnrollment.init(
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
    studentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (student)',
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Completed', 'Dropped', 'Suspended'),
      defaultValue: 'Active',
    },
    progress: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: 'Progress percentage 0-100',
    },
    totalScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    certificateId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Certificate',
    },
    certificateEarned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    certificateDate: {
      type: DataTypes.DATE,
      allowNull: true,
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
    tableName: 'student_enrollment',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'courseId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
      { fields: ['certificateEarned'] },
      { fields: ['organizationId', 'studentId', 'status'] },
      {
        fields: ['organizationId', 'courseId', 'status'],
        unique: true,
        where: { deletedAt: null },
        name: 'uq_enrollment_active',
      },
    ],
  }
);

export default StudentEnrollment;
