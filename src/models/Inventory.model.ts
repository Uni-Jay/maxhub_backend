import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IInventory {
  id: bigint;
  organizationId: bigint;
  warehouseId?: bigint;
  itemName: string;
  sku: string;
  itemType: 'Bead' | 'Bag' | 'Material' | 'Office Equipment' | 'Tech Equipment' | 'Other';
  category: string;
  description?: string;
  unitOfMeasure: 'Piece' | 'Box' | 'Kg' | 'Meter' | 'Liter' | 'Pack';
  reorderLevel: number;
  reorderQuantity: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  unitCost: number;
  totalValue: number;
  lastRestockDate?: Date;
  supplier?: string;
  status: 'Active' | 'Inactive' | 'Discontinued' | 'Low Stock';
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Inventory extends Model<IInventory> implements IInventory {
  declare id: bigint;
  declare organizationId: bigint;
  declare warehouseId?: bigint;
  declare itemName: string;
  declare sku: string;
  declare itemType: 'Bead' | 'Bag' | 'Material' | 'Office Equipment' | 'Tech Equipment' | 'Other';
  declare category: string;
  declare description?: string;
  declare unitOfMeasure: 'Piece' | 'Box' | 'Kg' | 'Meter' | 'Liter' | 'Pack';
  declare reorderLevel: number;
  declare reorderQuantity: number;
  declare currentStock: number;
  declare reservedStock: number;
  declare availableStock: number;
  declare unitCost: number;
  declare totalValue: number;
  declare lastRestockDate?: Date;
  declare supplier?: string;
  declare status: 'Active' | 'Inactive' | 'Discontinued' | 'Low Stock';
  declare location?: string;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Inventory.init(
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
    warehouseId: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    itemName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    itemType: {
      type: DataTypes.ENUM('Bead', 'Bag', 'Material', 'Office Equipment', 'Tech Equipment', 'Other'),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unitOfMeasure: {
      type: DataTypes.ENUM('Piece', 'Box', 'Kg', 'Meter', 'Liter', 'Pack'),
      defaultValue: 'Piece',
    },
    reorderLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reorderQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currentStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reservedStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    availableStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    lastRestockDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    supplier: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Discontinued', 'Low Stock'),
      defaultValue: 'Active',
    },
    location: {
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
    tableName: 'inventory',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['sku'] },
      { fields: ['itemType'] },
      { fields: ['warehouseId'] },
    ],
  }
);

export default Inventory;
