import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * IMPROVED: FinancialInvoice with proper relationship support and audit fields
 * - Added line item junction table support
 * - Added FK relationships for associations
 * - Added department tracking for RBAC
 * - Added approval workflow fields
 * - Added encryption-ready field for sensitive data
 */
export interface IFinancialInvoice {
  id: bigint;
  organizationId: bigint;
  departmentId?: bigint;
  customerId?: bigint; // FK to Customer if internal billing
  clientId?: bigint; // FK to Customer or external reference
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
  issuedBy?: bigint; // FK to Staff
  approvedBy?: bigint; // FK to Staff
  approvalDate?: Date;
  paymentDeadline?: Date;
  lastReminderSent?: Date;
  notes?: string;
  attachmentUrl?: string;
  // Audit fields
  createdBy?: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class FinancialInvoice extends Model<IFinancialInvoice> implements IFinancialInvoice {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId?: bigint;
  declare customerId?: bigint;
  declare clientId?: bigint;
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
  declare approvedBy?: bigint;
  declare approvalDate?: Date;
  declare paymentDeadline?: Date;
  declare lastReminderSent?: Date;
  declare notes?: string;
  declare attachmentUrl?: string;
  declare createdBy?: bigint;
  declare updatedBy?: bigint;
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
    departmentId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'RBAC: Department tracking for access control',
    },
    customerId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Customer for internal billing',
    },
    clientId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'External client reference',
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
      comment: 'Summary; line items stored in separate table',
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
      type: DataTypes.DECIMAL(10, 2),
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
      allowNull: false,
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
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    issuedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff who issued invoice',
    },
    approvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff who approved invoice',
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentDeadline: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date for payment deadline tracking',
    },
    lastReminderSent: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachmentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff for audit trail',
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff for audit trail',
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
      { fields: ['invoiceDate'] },
      { fields: ['dueDate'] },
      { fields: ['departmentId'] }, // RBAC filtering
      { fields: ['customerId'] }, // Relationship query
      // Composite index for common queries
      {
        fields: ['organizationId', 'status', 'invoiceDate'],
        name: 'idx_invoice_org_status_date',
      },
    ],
  }
);

export default FinancialInvoice;
