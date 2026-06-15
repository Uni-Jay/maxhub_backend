import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface ICustomer {
  id: bigint;
  organizationId: bigint;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName?: string;
  businessType?: 'Wholesale' | 'Retail' | 'Distributor' | 'Individual';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  totalPurchases: number;
  totalSpent: number;
  status: 'Active' | 'Inactive' | 'Blacklisted' | 'VIP';
  assignedSalesRep?: bigint;
  lastPurchaseDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Customer extends Model<ICustomer> implements ICustomer {
  declare id: bigint;
  declare organizationId: bigint;
  declare firstName: string;
  declare lastName: string;
  declare email: string;
  declare phone: string;
  declare businessName?: string;
  declare businessType?: 'Wholesale' | 'Retail' | 'Distributor' | 'Individual';
  declare address: string;
  declare city: string;
  declare state: string;
  declare zipCode: string;
  declare country: string;
  declare totalPurchases: number;
  declare totalSpent: number;
  declare status: 'Active' | 'Inactive' | 'Blacklisted' | 'VIP';
  declare assignedSalesRep?: bigint;
  declare lastPurchaseDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Customer.init(
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
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
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
    businessName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    businessType: {
      type: DataTypes.ENUM('Wholesale', 'Retail', 'Distributor', 'Individual'),
      allowNull: true,
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
    totalPurchases: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalSpent: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Blacklisted', 'VIP'),
      defaultValue: 'Active',
    },
    assignedSalesRep: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    lastPurchaseDate: {
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
    tableName: 'customer',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['assignedSalesRep'] },
    ],
  }
);

export default Customer;
