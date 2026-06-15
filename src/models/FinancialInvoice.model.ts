import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IFinancialInvoice {
  id: bigint;
  organizationId: bigint;
  clientId?: string;
  clientName: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  description: string;
  subtotal: number;
  taxPercentage?: number;
  taxAmount?: number;
  discountPercentage?: number;
  discountAmount?: number;
  totalAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentTerms?: string;
  issuedBy?: bigint;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class FinancialInvoice extends Model<IFinancialInvoice> implements IFinancialInvoice {
  declare id: bigint;
  declare organizationId: bigint;
  declare clientId?: string;
  declare clientName: string;
  declare invoiceNumber: string;
  declare invoiceDate: Date;
  declare dueDate: Date;
  declare description: string;
  declare subtotal: number;
  declare taxPercentage?: number;
  declare taxAmount?: number;
  declare discountPercentage?: number;
  declare discountAmount?: number;
  declare totalAmount: number;
  declare amountPaid: number;
  declare remainingAmount: number;
  declare status: 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
  declare paymentTerms?: string;
  declare issuedBy?: bigint;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

FinancialInvoice.init(
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
    clientId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    clientName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    invoiceNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    invoiceDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    taxPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    remainingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Cancelled'),
      defaultValue: 'Draft',
    },
    paymentTerms: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    issuedBy: {
      type: DataTypes.BIGINT,
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
    tableName: 'financial_invoice',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['invoiceNumber'] },
      { fields: ['dueDate'] },
    ],
  }
);

export default FinancialInvoice;
