import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface ISale {
  id: bigint;
  organizationId: bigint;
  customerId: bigint;
  saleDate: Date;
  saleNumber: string;
  productCategory: string;
  productDetails: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discountPercentage?: number;
  discountAmount?: number;
  taxAmount: number;
  netAmount: number;
  saleStatus: 'Completed' | 'Partial' | 'Cancelled';
  paymentReceived: number;
  outstandingAmount: number;
  salesPerson?: bigint;
  paymentMode?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  paymentDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Sale extends Model<ISale> implements ISale {
  declare id: bigint;
  declare organizationId: bigint;
  declare customerId: bigint;
  declare saleDate: Date;
  declare saleNumber: string;
  declare productCategory: string;
  declare productDetails: string;
  declare quantity: number;
  declare unitPrice: number;
  declare totalAmount: number;
  declare discountPercentage?: number;
  declare discountAmount?: number;
  declare taxAmount: number;
  declare netAmount: number;
  declare saleStatus: 'Completed' | 'Partial' | 'Cancelled';
  declare paymentReceived: number;
  declare outstandingAmount: number;
  declare salesPerson?: bigint;
  declare paymentMode?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
  declare paymentDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Sale.init(
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
    saleDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    saleNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    productCategory: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    productDetails: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    discountPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    netAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    saleStatus: {
      type: DataTypes.ENUM('Completed', 'Partial', 'Cancelled'),
      defaultValue: 'Completed',
    },
    paymentReceived: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    outstandingAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    salesPerson: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    paymentMode: {
      type: DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
      allowNull: true,
    },
    paymentDate: {
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
    tableName: 'sale',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'customerId'] },
      { fields: ['saleNumber'] },
      { fields: ['saleDate'] },
      { fields: ['saleStatus'] },
    ],
  }
);

export default Sale;
