import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IInventorySupplier {
  id: bigint;
  organizationId: bigint;
  supplierName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  taxId?: string;
  bankAccountNumber?: string;
  bankName?: string;
  paymentTerms: string;
  leadTime: number; // in days
  status: 'Active' | 'Inactive' | 'Blocked' | 'Suspended';
  ratingScore?: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class InventorySupplier extends Model<IInventorySupplier> implements IInventorySupplier {
  declare id: bigint;
  declare organizationId: bigint;
  declare supplierName: string;
  declare contactPerson: string;
  declare email: string;
  declare phone: string;
  declare address: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare country: string;
  declare taxId?: string;
  declare bankAccountNumber?: string;
  declare bankName?: string;
  declare paymentTerms: string;
  declare leadTime: number;
  declare status: 'Active' | 'Inactive' | 'Blocked' | 'Suspended';
  declare ratingScore?: number;
  declare totalOrders: number;
  declare totalSpent: number;
  declare lastOrderDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

InventorySupplier.init(
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
    supplierName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    zipCode: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    taxId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    paymentTerms: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    leadTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Blocked', 'Suspended'),
      defaultValue: 'Active',
    },
    ratingScore: {
      type: DataTypes.DECIMAL(3, 1),
      allowNull: true,
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalSpent: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    lastOrderDate: {
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
    tableName: 'inventory_supplier',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['email'] },
      { fields: ['supplierName'] },
    ],
  }
);

export default InventorySupplier;
