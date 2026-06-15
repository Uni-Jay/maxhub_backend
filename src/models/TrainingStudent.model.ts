import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface ITrainingStudent {
  id: bigint;
  organizationId: bigint;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  trainingProgram: string;
  enrollmentDate: Date;
  completionDate?: Date;
  courseLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  trainingMode: 'Online' | 'Offline' | 'Hybrid';
  status: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped' | 'Suspended';
  assignedInstructor?: bigint; // Staff ID
  certificationStatus: 'Not Eligible' | 'Eligible' | 'Certified';
  performanceScore?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class TrainingStudent extends Model<ITrainingStudent> implements ITrainingStudent {
  declare id: bigint;
  declare organizationId: bigint;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare trainingProgram: string;
  declare enrollmentDate: Date;
  declare completionDate?: Date;
  declare courseLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  declare trainingMode: 'Online' | 'Offline' | 'Hybrid';
  declare status: 'Enrolled' | 'In Progress' | 'Completed' | 'Dropped' | 'Suspended';
  declare assignedInstructor?: bigint;
  declare certificationStatus: 'Not Eligible' | 'Eligible' | 'Certified';
  declare performanceScore?: number;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

TrainingStudent.init(
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
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    trainingProgram: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    courseLevel: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced', 'Expert'),
      defaultValue: 'Beginner',
    },
    trainingMode: {
      type: DataTypes.ENUM('Online', 'Offline', 'Hybrid'),
      defaultValue: 'Online',
    },
    status: {
      type: DataTypes.ENUM('Enrolled', 'In Progress', 'Completed', 'Dropped', 'Suspended'),
      defaultValue: 'Enrolled',
    },
    assignedInstructor: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    certificationStatus: {
      type: DataTypes.ENUM('Not Eligible', 'Eligible', 'Certified'),
      defaultValue: 'Not Eligible',
    },
    performanceScore: {
      type: DataTypes.DECIMAL(5, 2),
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
    tableName: 'training_student',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['email'] },
      { fields: ['enrollmentDate'] },
    ],
  }
);

export default TrainingStudent;
