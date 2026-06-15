import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * NEW TABLE: InventoryLocation
 * Enables: Multi-warehouse/multi-location inventory tracking
 * Replaces: Single warehouseId per inventory item
 * Scalability: Handles 1000+ warehouses with 100K+ items efficiently
 */
export interface IInventoryLocation {
  id: bigint;
  organizationId: bigint;
  inventoryId: bigint;
  warehouseId: bigint;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  binLocation?: string; // Rack/shelf location
  lastCountDate?: Date;
  minStockLevel?: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  updatedAt: Date;
}

export class InventoryLocation extends Model<IInventoryLocation> implements IInventoryLocation {
  declare id: bigint;
  declare organizationId: bigint;
  declare inventoryId: bigint;
  declare warehouseId: bigint;
  declare currentStock: number;
  declare reservedStock: number;
  declare availableStock: number;
  declare binLocation?: string;
  declare lastCountDate?: Date;
  declare minStockLevel?: number;
  declare maxStockLevel?: number;
  declare reorderPoint?: number;
  declare updatedAt: Date;
}

InventoryLocation.init(
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
      allowNull: false,
      comment: 'FK to warehouse',
    },
    currentStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    reservedStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Stock allocated to orders but not yet shipped',
    },
    availableStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'currentStock - reservedStock',
    },
    binLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Physical location: Rack-Shelf-Bin format',
    },
    lastCountDate: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last physical inventory count',
    },
    minStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Alert when falls below this',
    },
    maxStockLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Alert when exceeds this',
    },
    reorderPoint: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Automatic reorder trigger',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'inventory_location',
    timestamps: true,
    createdAt: false,
    indexes: [
      // Unique constraint: one location per item per warehouse
      {
        fields: ['inventoryId', 'warehouseId'],
        unique: true,
        name: 'uq_inventory_location_unique',
      },
      // Queries by warehouse
      { fields: ['organizationId', 'warehouseId'] },
      // Queries by inventory
      { fields: ['organizationId', 'inventoryId'] },
      // Find items needing reorder
      {
        fields: ['organizationId', 'warehouseId', 'availableStock'],
        name: 'idx_inventory_location_reorder',
      },
    ],
  }
);

export default InventoryLocation;
