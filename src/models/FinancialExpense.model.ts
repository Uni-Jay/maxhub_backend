import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IFinancialExpense {
  id: bigint;
  organizationId: bigint;
  departmentId?: bigint;
  expenseDate: Date;
  expenseCategory: 'Salary' | 'Utilities' | 'Rent' | 'Supplies' | 'Maintenance' | 'Travel' | 'Other';
  description: string;
  amount: number;
  vendorName?: string;
  vendorInvoiceNumber?: string;
  paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentDate?: Date;
  attachmentUrl?: string;
  requestedBy?: bigint;
  approvedBy?: bigint;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvalDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class FinancialExpense extends Model<IFinancialExpense> implements IFinancialExpense {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId?: bigint;
  declare expenseDate: Date;
  declare expenseCategory: 'Salary' | 'Utilities' | 'Rent' | 'Supplies' | 'Maintenance' | 'Travel' | 'Other';
  declare description: string;
  declare amount: number;
  declare vendorName?: string;
  declare vendorInvoiceNumber?: string;
  declare paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  declare paymentStatus: 'Pending' | 'Paid' | 'Failed';
  declare paymentDate?: Date;
  declare attachmentUrl?: string;
  declare requestedBy?: bigint;
  declare approvedBy?: bigint;
  declare approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  declare approvalDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

FinancialExpense.init(
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
      allowNull: true,
    },
    expenseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expenseCategory: {
      type: DataTypes.ENUM('Salary', 'Utilities', 'Rent', 'Supplies', 'Maintenance', 'Travel', 'Other'),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    vendorName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    vendorInvoiceNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM('Pending', 'Paid', 'Failed'),
      defaultValue: 'Pending',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    requestedBy: {
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
    approvalDate: {
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
    tableName: 'financial_expense',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'expenseDate'] },
      { fields: ['departmentId'] },
      { fields: ['approvalStatus'] },
    ],
  }
);

export default FinancialExpense;
