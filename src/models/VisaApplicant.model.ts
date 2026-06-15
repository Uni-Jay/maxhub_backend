import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IVisaApplicant {
  id: bigint;
  organizationId: bigint;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passportNumber: string;
  visaType: 'Tourist' | 'Business' | 'Student' | 'Work' | 'Residence';
  destinationCountry: string;
  applicationDate: Date;
  status: 'New' | 'In Progress' | 'Document Review' | 'Interview' | 'Approved' | 'Rejected' | 'Cancelled';
  assignedTo?: bigint; // Staff ID
  priorityLevel: 'Low' | 'Medium' | 'High' | 'Urgent';
  documentStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
  interviewScheduled?: Date;
  expectedDecisionDate?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class VisaApplicant extends Model<IVisaApplicant> implements IVisaApplicant {
  declare id: bigint;
  declare organizationId: bigint;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare passportNumber: string;
  declare visaType: 'Tourist' | 'Business' | 'Student' | 'Work' | 'Residence';
  declare destinationCountry: string;
  declare applicationDate: Date;
  declare status: 'New' | 'In Progress' | 'Document Review' | 'Interview' | 'Approved' | 'Rejected' | 'Cancelled';
  declare assignedTo?: bigint;
  declare priorityLevel: 'Low' | 'Medium' | 'High' | 'Urgent';
  declare documentStatus: 'Pending' | 'Submitted' | 'Approved' | 'Rejected';
  declare interviewScheduled?: Date;
  declare expectedDecisionDate?: Date;
  declare rejectionReason?: string;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

VisaApplicant.init(
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
    passportNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    visaType: {
      type: DataTypes.ENUM('Tourist', 'Business', 'Student', 'Work', 'Residence'),
      allowNull: false,
    },
    destinationCountry: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    applicationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('New', 'In Progress', 'Document Review', 'Interview', 'Approved', 'Rejected', 'Cancelled'),
      defaultValue: 'New',
    },
    assignedTo: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    priorityLevel: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
      defaultValue: 'Medium',
    },
    documentStatus: {
      type: DataTypes.ENUM('Pending', 'Submitted', 'Approved', 'Rejected'),
      defaultValue: 'Pending',
    },
    interviewScheduled: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expectedDecisionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
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
    tableName: 'visa_applicant',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['passportNumber'] },
      { fields: ['email'] },
      { fields: ['assignedTo'] },
      { fields: ['applicationDate'] },
    ],
  }
);

export default VisaApplicant;
