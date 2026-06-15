import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IRevenue {
  id: bigint;
  organizationId: bigint;
  revenueDate: Date;
  revenueSource: string;
  category: 'Sales' | 'Service' | 'Investment' | 'Other Income' | 'Rental';
  amount: number;
  description?: string;
  referenceNumber?: string;
  paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  invoiceNumber?: string;
  clientName?: string;
  recordedBy?: bigint;
  approvedBy?: bigint;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Revenue extends Model<IRevenue> implements IRevenue {
  declare id: bigint;
  declare organizationId: bigint;
  declare revenueDate: Date;
  declare revenueSource: string;
  declare category: 'Sales' | 'Service' | 'Investment' | 'Other Income' | 'Rental';
  declare amount: number;
  declare description?: string;
  declare referenceNumber?: string;
  declare paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  declare invoiceNumber?: string;
  declare clientName?: string;
  declare recordedBy?: bigint;
  declare approvedBy?: bigint;
  declare approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Revenue.init(
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
    revenueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revenueSource: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('Sales', 'Service', 'Investment', 'Other Income', 'Rental'),
      defaultValue: 'Sales',
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referenceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
      defaultValue: 'Transfer',
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    clientName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    recordedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    approvalStatus: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending',
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
    tableName: 'revenue',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'revenueDate'] },
      { fields: ['category'] },
      { fields: ['approvalStatus'] },
    ],
  }
);

export default Revenue;
