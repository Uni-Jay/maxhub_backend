import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IFollowUp {
  id: bigint;
  organizationId: bigint;
  visaApplicantId: bigint;
  followUpDate: Date;
  followUpType: 'Status Check' | 'Document Request' | 'Payment Reminder' | 'Interview Prep' | 'Consultation' | 'Other';
  followUpBy?: bigint; // Staff ID
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'Completed' | 'Cancelled';
  completedDate?: Date;
  outcome?: string;
  nextFollowUpDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class FollowUp extends Model<IFollowUp> implements IFollowUp {
  declare id: bigint;
  declare organizationId: bigint;
  declare visaApplicantId: bigint;
  declare followUpDate: Date;
  declare followUpType: 'Status Check' | 'Document Request' | 'Payment Reminder' | 'Interview Prep' | 'Consultation' | 'Other';
  declare followUpBy?: bigint;
  declare priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  declare status: 'Pending' | 'Completed' | 'Cancelled';
  declare completedDate?: Date;
  declare outcome?: string;
  declare nextFollowUpDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

FollowUp.init(
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
    visaApplicantId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    followUpDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    followUpType: {
      type: DataTypes.ENUM('Status Check', 'Document Request', 'Payment Reminder', 'Interview Prep', 'Consultation', 'Other'),
      allowNull: false,
    },
    followUpBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
      defaultValue: 'Medium',
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Completed', 'Cancelled'),
      defaultValue: 'Pending',
    },
    completedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextFollowUpDate: {
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
    tableName: 'follow_up',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'visaApplicantId'] },
      { fields: ['followUpDate'] },
      { fields: ['status'] },
    ],
  }
);

export default FollowUp;
