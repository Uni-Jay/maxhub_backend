import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: PaymentAllocation
 * Enables: Proper payment tracking to invoices, partial payment handling
 * Replaces: Single payment → single invoice assumption
 * Security: Tracks payment integrity for financial audits
 */
export interface IPaymentAllocation {
  id: bigint;
  organizationId: bigint;
  paymentId: bigint;
  invoiceId: bigint;
  amountAllocated: number;
  allocationDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class PaymentAllocation
  extends Model<IPaymentAllocation>
  implements IPaymentAllocation
{
  declare id: bigint;
  declare organizationId: bigint;
  declare paymentId: bigint;
  declare invoiceId: bigint;
  declare amountAllocated: number;
  declare allocationDate: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

PaymentAllocation.init(
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
    paymentId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to financial_payment',
    },
    invoiceId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to financial_invoice',
    },
    amountAllocated: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    allocationDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'payment_allocation',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'paymentId'] },
      { fields: ['invoiceId'] },
      // Unique constraint: one allocation per payment-invoice pair
      {
        fields: ['paymentId', 'invoiceId'],
        unique: true,
        name: 'uq_payment_allocation_unique',
      },
    ],
  }
);

export default PaymentAllocation;
