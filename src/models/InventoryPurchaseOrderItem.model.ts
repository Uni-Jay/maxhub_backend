import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: InventoryPurchaseOrderItem
 * Replaces items JSON array in InventoryPurchaseOrder
 * Enables: Item-level tracking, partial receipt, price history, searchability
 */
export interface IInventoryPurchaseOrderItem {
  id: bigint;
  organizationId: bigint;
  purchaseOrderId: bigint;
  inventoryId: bigint;
  lineNumber: number;
  quantity: number;
  unitPrice: number;
  amount: number;
  receivedQuantity: number;
  damagedQuantity?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class InventoryPurchaseOrderItem
  extends Model<IInventoryPurchaseOrderItem>
  implements IInventoryPurchaseOrderItem
{
  declare id: bigint;
  declare organizationId: bigint;
  declare purchaseOrderId: bigint;
  declare inventoryId: bigint;
  declare lineNumber: number;
  declare quantity: number;
  declare unitPrice: number;
  declare amount: number;
  declare receivedQuantity: number;
  declare damagedQuantity?: number;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

InventoryPurchaseOrderItem.init(
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
    purchaseOrderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to inventory_purchase_order',
    },
    inventoryId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to inventory',
    },
    lineNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Ordered quantity',
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
    receivedQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Tracks partial receipt',
    },
    damagedQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Damaged items on receipt',
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
    tableName: 'inventory_purchase_order_item',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'purchaseOrderId'] },
      { fields: ['inventoryId'] },
      { fields: ['purchaseOrderId', 'lineNumber'] },
      // Index for "items not fully received" queries
      {
        fields: ['purchaseOrderId'],
        where: { deletedAt: null },
      },
    ],
  }
);

export default InventoryPurchaseOrderItem;
