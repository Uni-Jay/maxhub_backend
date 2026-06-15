import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * PHASE 19: LMS - Submitted Assignment Model
 * Student assignment submissions with grading
 */
export interface ISubmittedAssignment {
  id: bigint;
  organizationId: bigint;
  assignmentId: bigint;
  studentId: bigint;
  submissionDate: Date;
  submissionUrl?: string;
  submissionText?: string;
  attachmentUrl?: string;
  status: 'Submitted' | 'Graded' | 'Returned' | 'Late';
  isLate: boolean;
  pointsEarned?: number;
  feedback?: string;
  gradedBy?: bigint;
  gradedDate?: Date;
  attempt: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class SubmittedAssignment
  extends Model<ISubmittedAssignment>
  implements ISubmittedAssignment
{
  declare id: bigint;
  declare organizationId: bigint;
  declare assignmentId: bigint;
  declare studentId: bigint;
  declare submissionDate: Date;
  declare submissionUrl?: string;
  declare submissionText?: string;
  declare attachmentUrl?: string;
  declare status: 'Submitted' | 'Graded' | 'Returned' | 'Late';
  declare isLate: boolean;
  declare pointsEarned?: number;
  declare feedback?: string;
  declare gradedBy?: bigint;
  declare gradedDate?: Date;
  declare attempt: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

SubmittedAssignment.init(
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
    assignmentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Assignment',
    },
    studentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to Staff (student)',
    },
    submissionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    submissionUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    submissionText: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Submitted', 'Graded', 'Returned', 'Late'),
      defaultValue: 'Submitted',
    },
    isLate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    pointsEarned: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    feedback: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    },
    gradedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff (instructor)',
    },
    gradedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attempt: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    tableName: 'submitted_assignment',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'assignmentId'] },
      { fields: ['studentId'] },
      { fields: ['status'] },
      { fields: ['gradedDate'] },
      { fields: ['organizationId', 'studentId', 'assignmentId'] },
    ],
  }
);

export default SubmittedAssignment;
