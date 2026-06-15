import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IFinancialPayment {
  id: bigint;
  organizationId: bigint;
  invoiceId?: bigint;
  paymentNumber: string;
  paymentDate: Date;
  paymentType: 'Income' | 'Expense' | 'Salary' | 'Vendor' | 'Other';
  amount: number;
  paymentMethod: 'Bank Transfer' | 'Check' | 'Cash' | 'Card' | 'Digital Wallet';
  transactionReference: string;
  paymentStatus: 'Pending' | 'Processed' | 'Completed' | 'Failed' | 'Cancelled';
  fromAccount?: string;
  toAccount?: string;
  bankName?: string;
  chequeNumber?: string;
  recipientName?: string;
  description?: string;
  processedBy?: bigint;
  approvedBy?: bigint;
  attachmentUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class FinancialPayment extends Model<IFinancialPayment> implements IFinancialPayment {
  declare id: bigint;
  declare organizationId: bigint;
  declare invoiceId?: bigint;
  declare paymentNumber: string;
  declare paymentDate: Date;
  declare paymentType: 'Income' | 'Expense' | 'Salary' | 'Vendor' | 'Other';
  declare amount: number;
  declare paymentMethod: 'Bank Transfer' | 'Check' | 'Cash' | 'Card' | 'Digital Wallet';
  declare transactionReference: string;
  declare paymentStatus: 'Pending' | 'Processed' | 'Completed' | 'Failed' | 'Cancelled';
  declare fromAccount?: string;
  declare toAccount?: string;
  declare bankName?: string;
  declare chequeNumber?: string;
  declare recipientName?: string;
  declare description?: string;
  declare processedBy?: bigint;
  declare approvedBy?: bigint;
  declare attachmentUrl?: string;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

FinancialPayment.init(
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
    invoiceId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    paymentType: {
      type: DataTypes.ENUM('Income', 'Expense', 'Salary', 'Vendor', 'Other'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM('Bank Transfer', 'Check', 'Cash', 'Card', 'Digital Wallet'),
      allowNull: false,
    },
    transactionReference: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('Pending', 'Processed', 'Completed', 'Failed', 'Cancelled'),
      defaultValue: 'Pending',
    },
    fromAccount: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    toAccount: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    chequeNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    recipientName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
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
    tableName: 'financial_payment',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'paymentDate'] },
      { fields: ['paymentNumber'] },
      { fields: ['paymentStatus'] },
    ],
  }
);

export default FinancialPayment;
