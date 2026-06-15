import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: InvoiceLineItem
 * Replaces storing invoice details as plain text
 * Enables: Product analytics, invoice breakdown queries, tax tracking per line
 */
export interface IInvoiceLineItem {
  id: bigint;
  organizationId: bigint;
  invoiceId: bigint;
  productId?: bigint;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxPercentage?: number;
  taxAmount?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class InvoiceLineItem extends Model<IInvoiceLineItem> implements IInvoiceLineItem {
  declare id: bigint;
  declare organizationId: bigint;
  declare invoiceId: bigint;
  declare productId?: bigint;
  declare lineNumber: number;
  declare description: string;
  declare quantity: number;
  declare unitPrice: number;
  declare amount: number;
  declare taxPercentage?: number;
  declare taxAmount?: number;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

InvoiceLineItem.init(
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
      allowNull: false,
      comment: 'FK to financial_invoice',
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to product table',
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Display order in invoice',
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'quantity * unitPrice',
    },
    taxPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: 'invoice_line_item',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'invoiceId'] },
      { fields: ['productId'] },
      { fields: ['invoiceId', 'lineNumber'] },
    ],
  }
);

export default InvoiceLineItem;
