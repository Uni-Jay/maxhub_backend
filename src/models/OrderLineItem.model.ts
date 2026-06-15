import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: OrderLineItem
 * Replaces implicit order items, enables multi-item orders with proper tracking
 * Enables: Product analytics, order breakdown, inventory deduction tracking
 */
export interface IOrderLineItem {
  id: bigint;
  organizationId: bigint;
  orderId: bigint;
  inventoryId?: bigint; // FK to Inventory for stock deduction
  productId?: bigint; // FK to Product master
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxPercentage?: number;
  taxAmount?: number;
  deliveredQuantity?: number; // For partial delivery tracking
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class OrderLineItem extends Model<IOrderLineItem> implements IOrderLineItem {
  declare id: bigint;
  declare organizationId: bigint;
  declare orderId: bigint;
  declare inventoryId?: bigint;
  declare productId?: bigint;
  declare lineNumber: number;
  declare description: string;
  declare quantity: number;
  declare unitPrice: number;
  declare amount: number;
  declare taxPercentage?: number;
  declare taxAmount?: number;
  declare deliveredQuantity?: number;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

OrderLineItem.init(
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
    orderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to order_tracking',
    },
    inventoryId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to inventory for stock management',
    },
    productId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to product master',
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Display order in order',
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
    deliveredQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Tracks partial delivery',
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
    tableName: 'order_line_item',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'orderId'] },
      { fields: ['productId'] },
      { fields: ['inventoryId'] },
      { fields: ['orderId', 'lineNumber'] },
    ],
  }
);

export default OrderLineItem;
