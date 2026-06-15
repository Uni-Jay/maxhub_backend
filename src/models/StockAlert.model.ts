import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IStockAlert {
  id: bigint;
  organizationId: bigint;
  inventoryId: bigint;
  alertType: 'Low Stock' | 'Out of Stock' | 'Overstocked' | 'Expired' | 'Damaged';
  currentStock: number;
  threshold: number;
  status: 'Active' | 'Acknowledged' | 'Resolved' | 'Ignored';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  alertDate: Date;
  acknowledgedBy?: bigint;
  acknowledgedDate?: Date;
  resolvedBy?: bigint;
  resolvedDate?: Date;
  action: 'Purchase Order' | 'Stock Transfer' | 'Write Off' | 'Other';
  actionDetails?: string;
  notifiedTo?: string; // JSON array of staff IDs or emails
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class StockAlert extends Model<IStockAlert> implements IStockAlert {
  declare id: bigint;
  declare organizationId: bigint;
  declare inventoryId: bigint;
  declare alertType: 'Low Stock' | 'Out of Stock' | 'Overstocked' | 'Expired' | 'Damaged';
  declare currentStock: number;
  declare threshold: number;
  declare status: 'Active' | 'Acknowledged' | 'Resolved' | 'Ignored';
  declare priority: 'Low' | 'Medium' | 'High' | 'Critical';
  declare alertDate: Date;
  declare acknowledgedBy?: bigint;
  declare acknowledgedDate?: Date;
  declare resolvedBy?: bigint;
  declare resolvedDate?: Date;
  declare action: 'Purchase Order' | 'Stock Transfer' | 'Write Off' | 'Other';
  declare actionDetails?: string;
  declare notifiedTo?: string;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

StockAlert.init(
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
    },
    alertType: {
      type: DataTypes.ENUM('Low Stock', 'Out of Stock', 'Overstocked', 'Expired', 'Damaged'),
      allowNull: false,
    },
    currentStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    threshold: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Acknowledged', 'Resolved', 'Ignored'),
      defaultValue: 'Active',
    },
    priority: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      defaultValue: 'Medium',
    },
    alertDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    acknowledgedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    acknowledgedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    resolvedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    action: {
      type: DataTypes.ENUM('Purchase Order', 'Stock Transfer', 'Write Off', 'Other'),
      allowNull: false,
    },
    actionDetails: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    notifiedTo: {
      type: DataTypes.JSON,
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
    tableName: 'stock_alert',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['inventoryId'] },
      { fields: ['alertType'] },
      { fields: ['priority'] },
    ],
  }
);

export default StockAlert;
