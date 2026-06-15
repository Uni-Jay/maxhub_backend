import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IConsultation {
  id: bigint;
  organizationId: bigint;
  visaApplicantId: bigint;
  consultationDate: Date;
  consultantId?: bigint;
  consultationType: 'Initial' | 'Follow-up' | 'Document Review' | 'Interview Prep' | 'Other';
  duration: number; // in minutes
  topic: string;
  discussionPoints?: string;
  recommendations?: string;
  nextSteps?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Consultation extends Model<IConsultation> implements IConsultation {
  declare id: bigint;
  declare organizationId: bigint;
  declare visaApplicantId: bigint;
  declare consultationDate: Date;
  declare consultantId?: bigint;
  declare consultationType: 'Initial' | 'Follow-up' | 'Document Review' | 'Interview Prep' | 'Other';
  declare duration: number;
  declare topic: string;
  declare discussionPoints?: string;
  declare recommendations?: string;
  declare nextSteps?: string;
  declare status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Rescheduled';
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Consultation.init(
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
    consultationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    consultantId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    consultationType: {
      type: DataTypes.ENUM('Initial', 'Follow-up', 'Document Review', 'Interview Prep', 'Other'),
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    topic: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    discussionPoints: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextSteps: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Scheduled', 'Completed', 'Cancelled', 'Rescheduled'),
      defaultValue: 'Scheduled',
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
    tableName: 'consultation',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'visaApplicantId'] },
      { fields: ['consultationDate'] },
      { fields: ['consultantId'] },
    ],
  }
);

export default Consultation;
