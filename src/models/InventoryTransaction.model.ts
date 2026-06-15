import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: InventoryTransaction
 * Enables: Complete inventory audit trail, FIFO/LIFO valuation, stock reconciliation
 * Replaces: Denormalized inventory.currentStock with transactional records
 * Benefit: Query stock at any point in time, reconcile variances, prevent fraud
 */
export interface IInventoryTransaction {
  id: bigint;
  organizationId: bigint;
  inventoryId: bigint;
  warehouseId?: bigint;
  transactionType: 'In' | 'Out' | 'Adjustment' | 'Return' | 'Damage' | 'Count';
  quantity: number;
  unitCost?: number;
  transactionAmount?: number;
  referenceType?: 'PurchaseOrder' | 'Sale' | 'Order' | 'Manual' | 'CountAdjustment';
  referenceId?: bigint;
  notes?: string;
  recordedBy?: bigint; // FK to Staff
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class InventoryTransaction
  extends Model<IInventoryTransaction>
  implements IInventoryTransaction
{
  declare id: bigint;
  declare organizationId: bigint;
  declare inventoryId: bigint;
  declare warehouseId?: bigint;
  declare transactionType: 'In' | 'Out' | 'Adjustment' | 'Return' | 'Damage' | 'Count';
  declare quantity: number;
  declare unitCost?: number;
  declare transactionAmount?: number;
  declare referenceType?: 'PurchaseOrder' | 'Sale' | 'Order' | 'Manual' | 'CountAdjustment';
  declare referenceId?: bigint;
  declare notes?: string;
  declare recordedBy?: bigint;
  declare recordedAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

InventoryTransaction.init(
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
    inventoryId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to inventory',
    },
    warehouseId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Which warehouse for multi-location',
    },
    transactionType: {
      type: DataTypes.ENUM('In', 'Out', 'Adjustment', 'Return', 'Damage', 'Count'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Can be negative for OUT/Damage',
    },
    unitCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: 'Cost per unit at transaction time',
    },
    transactionAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'quantity * unitCost',
    },
    referenceType: {
      type: DataTypes.ENUM('PurchaseOrder', 'Sale', 'Order', 'Manual', 'CountAdjustment'),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID of PO/Sale/Order that triggered transaction',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recordedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff who recorded transaction',
    },
    recordedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'inventory_transaction',
    paranoid: true,
    timestamps: true,
    indexes: [
      // Multi-tenant safety
      { fields: ['organizationId'] },
      // Find all transactions for an item
      { fields: ['organizationId', 'inventoryId'] },
      // Temporal queries
      { fields: ['recordedAt'], name: 'idx_transaction_recorded_at' },
      // Find transactions by reference
      { fields: ['referenceType', 'referenceId'] },
      // Performance for stock reconciliation
      {
        fields: ['organizationId', 'inventoryId', 'recordedAt'],
        name: 'idx_transaction_reconciliation',
      },
    ],
  }
);

export default InventoryTransaction;
