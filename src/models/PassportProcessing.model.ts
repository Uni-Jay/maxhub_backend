import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IPassportProcessing {
  id: bigint;
  organizationId: bigint;
  visaApplicantId: bigint;
  passportNumber: string;
  passportExpiryDate: Date;
  applicationDate: Date;
  processingStage: 'Submitted' | 'Under Review' | 'Approved' | 'Ready for Pickup' | 'Collected' | 'Rejected';
  processingFee: number;
  feePaid: boolean;
  feePaymentDate?: Date;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  pickupLocation?: string;
  status: 'Active' | 'Completed' | 'Delayed' | 'On Hold' | 'Cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class PassportProcessing extends Model<IPassportProcessing> implements IPassportProcessing {
  declare id: bigint;
  declare organizationId: bigint;
  declare visaApplicantId: bigint;
  declare passportNumber: string;
  declare passportExpiryDate: Date;
  declare applicationDate: Date;
  declare processingStage: 'Submitted' | 'Under Review' | 'Approved' | 'Ready for Pickup' | 'Collected' | 'Rejected';
  declare processingFee: number;
  declare feePaid: boolean;
  declare feePaymentDate?: Date;
  declare estimatedCompletionDate?: Date;
  declare actualCompletionDate?: Date;
  declare pickupLocation?: string;
  declare status: 'Active' | 'Completed' | 'Delayed' | 'On Hold' | 'Cancelled';
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

PassportProcessing.init(
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
    passportNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    passportExpiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    applicationDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    processingStage: {
      type: DataTypes.ENUM('Submitted', 'Under Review', 'Approved', 'Ready for Pickup', 'Collected', 'Rejected'),
      defaultValue: 'Submitted',
    },
    processingFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    feePaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    feePaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimatedCompletionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualCompletionDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pickupLocation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Completed', 'Delayed', 'On Hold', 'Cancelled'),
      defaultValue: 'Active',
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
    tableName: 'passport_processing',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'visaApplicantId'] },
      { fields: ['passportNumber'] },
      { fields: ['processingStage'] },
      { fields: ['status'] },
    ],
  }
);

export default PassportProcessing;
