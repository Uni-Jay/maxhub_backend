import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: Product Master
 * Enables: Consistent product tracking, pricing history, category analytics
 * Replaces: Product details stored as strings in Sales/Orders
 */
export interface IProduct {
  id: bigint;
  organizationId: bigint;
  productCode: string;
  productName: string;
  category: string;
  description?: string;
  unitPrice: number;
  standardCost: number;
  type: 'Product' | 'Service';
  sku?: string;
  status: 'Active' | 'Inactive' | 'Discontinued';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Product extends Model<IProduct> implements IProduct {
  declare id: bigint;
  declare organizationId: bigint;
  declare productCode: string;
  declare productName: string;
  declare category: string;
  declare description?: string;
  declare unitPrice: number;
  declare standardCost: number;
  declare type: 'Product' | 'Service';
  declare sku?: string;
  declare status: 'Active' | 'Inactive' | 'Discontinued';
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Product.init(
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
    productCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    productName: {
      type: DataTypes.STRING(255),
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
    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    standardCost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Product', 'Service'),
      defaultValue: 'Product',
    },
    sku: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Discontinued'),
      defaultValue: 'Active',
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
    tableName: 'product',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['productCode'] },
      { fields: ['category'] },
      { fields: ['sku'] },
    ],
  }
);

export default Product;
