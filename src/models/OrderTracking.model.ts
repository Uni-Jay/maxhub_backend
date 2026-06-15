import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IOrderTracking {
  id: bigint;
  organizationId: bigint;
  customerId: bigint;
  orderDate: Date;
  orderNumber: string;
  totalAmount: number;
  discountAmount?: number;
  taxAmount: number;
  finalAmount: number;
  orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  shippingAddress?: string;
  estimatedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  shippingTrackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class OrderTracking extends Model<IOrderTracking> implements IOrderTracking {
  declare id: bigint;
  declare organizationId: bigint;
  declare customerId: bigint;
  declare orderDate: Date;
  declare orderNumber: string;
  declare totalAmount: number;
  declare discountAmount?: number;
  declare taxAmount: number;
  declare finalAmount: number;
  declare orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
  declare paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  declare paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  declare shippingAddress?: string;
  declare estimatedDeliveryDate?: Date;
  declare actualDeliveryDate?: Date;
  declare shippingTrackingNumber?: string;
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
    customerId: {
      type: DataTypes.BIGINT,
      allowNull: false,
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
      type: DataTypes.ENUM('New', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'),
      defaultValue: 'New',
    },
    paymentStatus: {
      type: DataTypes.ENUM('Pending', 'Paid', 'Failed', 'Refunded'),
      defaultValue: 'Pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
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
      { fields: ['organizationId', 'customerId'] },
      { fields: ['orderNumber'] },
      { fields: ['orderDate'] },
      { fields: ['orderStatus'] },
    ],
  }
);

export default OrderTracking;
