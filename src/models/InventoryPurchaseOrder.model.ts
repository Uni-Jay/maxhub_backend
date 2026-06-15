import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IInventoryPurchaseOrder {
  id: bigint;
  organizationId: bigint;
  supplierId: bigint;
  poNumber: string;
  poDate: Date;
  expectedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  items: JSON; // Array of { inventoryId, quantity, unitPrice }
  totalQuantity: number;
  subtotal: number;
  taxPercentage?: number;
  taxAmount?: number;
  shippingCost?: number;
  totalAmount: number;
  orderStatus: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  paymentTerms?: string;
  deliveryAddress?: string;
  createdBy?: bigint;
  approvedBy?: bigint;
  approvalDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class InventoryPurchaseOrder extends Model<IInventoryPurchaseOrder> implements IInventoryPurchaseOrder {
  declare id: bigint;
  declare organizationId: bigint;
  declare supplierId: bigint;
  declare poNumber: string;
  declare poDate: Date;
  declare expectedDeliveryDate: Date;
  declare actualDeliveryDate?: Date;
  declare items: JSON;
  declare totalQuantity: number;
  declare subtotal: number;
  declare taxPercentage?: number;
  declare taxAmount?: number;
  declare shippingCost?: number;
  declare totalAmount: number;
  declare orderStatus: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Delivered' | 'Cancelled';
  declare paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  declare paymentTerms?: string;
  declare deliveryAddress?: string;
  declare createdBy?: bigint;
  declare approvedBy?: bigint;
  declare approvalDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

InventoryPurchaseOrder.init(
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
    supplierId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    poNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    poDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expectedDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    totalQuantity: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    shippingCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    orderStatus: {
      type: DataTypes.ENUM('Draft', 'Sent', 'Confirmed', 'Partial', 'Delivered', 'Cancelled'),
      defaultValue: 'Draft',
    },
    paymentStatus: {
      type: DataTypes.ENUM('Unpaid', 'Partially Paid', 'Paid'),
      defaultValue: 'Unpaid',
    },
    paymentTerms: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    deliveryAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
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
    tableName: 'inventory_purchase_order',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'supplierId'] },
      { fields: ['poNumber'] },
      { fields: ['orderStatus'] },
    ],
  }
);

export default InventoryPurchaseOrder;
