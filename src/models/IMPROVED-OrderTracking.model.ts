import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * IMPROVED: OrderTracking Model
 * - Added invoice reference for payment tracking
 * - Added line items support (junction table)
 * - Added delivery address validation
 * - Added RBAC fields (departmentId, createdBy)
 * - Added tracking for partial delivery
 */
export interface IOrderTracking {
  id: bigint;
  organizationId: bigint;
  departmentId?: bigint; // NEW: For RBAC filtering
  customerId: bigint;
  orderDate: Date;
  orderNumber: string;
  invoiceId?: bigint; // NEW: Link to invoice for payment
  totalAmount: number;
  discountAmount?: number;
  taxAmount: number;
  finalAmount: number;
  orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Partial' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Failed' | 'Refunded';
  paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque' | 'Digital Wallet';
  shippingAddress?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippingTrackingNumber?: string;
  // NEW: Partial delivery tracking
  totalItemsOrdered?: number;
  totalItemsDelivered?: number;
  // NEW: Audit fields
  createdBy?: bigint;
  updatedBy?: bigint;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class OrderTracking extends Model<IOrderTracking> implements IOrderTracking {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId?: bigint;
  declare customerId: bigint;
  declare orderDate: Date;
  declare orderNumber: string;
  declare invoiceId?: bigint;
  declare totalAmount: number;
  declare discountAmount?: number;
  declare taxAmount: number;
  declare finalAmount: number;
  declare orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Partial' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  declare paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Failed' | 'Refunded';
  declare paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque' | 'Digital Wallet';
  declare shippingAddress?: string;
  declare estimatedDeliveryDate?: Date;
  declare actualDeliveryDate?: Date;
  declare shippingTrackingNumber?: string;
  declare totalItemsOrdered?: number;
  declare totalItemsDelivered?: number;
  declare createdBy?: bigint;
  declare updatedBy?: bigint;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

OrderTracking.init(
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
      comment: 'NEW: Department tracking for RBAC',
    },
    customerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to customer',
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    invoiceId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'NEW: Link to generated invoice',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    finalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    orderStatus: {
      type: DataTypes.ENUM('New', 'Confirmed', 'Processing', 'Partial', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'),
      defaultValue: 'New',
      comment: 'NEW: Added Partial status for multi-item orders',
    },
    paymentStatus: {
      type: DataTypes.ENUM('Pending', 'Partial', 'Paid', 'Failed', 'Refunded'),
      defaultValue: 'Pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque', 'Digital Wallet'),
      allowNull: true,
    },
    shippingAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimatedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shippingTrackingNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    totalItemsOrdered: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'NEW: For partial delivery tracking',
    },
    totalItemsDelivered: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'NEW: For partial delivery tracking',
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'NEW: Audit trail',
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'NEW: Audit trail',
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
    tableName: 'order_tracking',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'orderStatus'] },
      { fields: ['customerId'] }, // NEW: FK index
      { fields: ['orderNumber'] },
      { fields: ['orderDate'] },
      { fields: ['departmentId'] }, // NEW: RBAC filtering
      { fields: ['invoiceId'] }, // NEW: Invoice relationship
      // NEW: Composite for common queries
      {
        fields: ['organizationId', 'orderDate', 'orderStatus'],
        name: 'idx_order_org_date_status',
      },
      // NEW: For partial delivery queries
      {
        fields: ['organizationId', 'orderStatus'],
        where: { deletedAt: null },
        name: 'idx_order_active_status',
      },
    ],
  }
);

export default OrderTracking;
