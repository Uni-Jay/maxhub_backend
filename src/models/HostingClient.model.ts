import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IHostingClient {
  id: bigint;
  organizationId: bigint;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  company: string;
  websiteDomain?: string;
  hostingType: 'Shared' | 'VPS' | 'Dedicated' | 'Cloud' | 'Other';
  serverLocation?: string;
  monthlyBillingAmount: number;
  billingCycle: 'Monthly' | 'Quarterly' | 'Annually';
  renewalDate: Date;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Expired';
  assignedAccount?: bigint;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class HostingClient extends Model<IHostingClient> implements IHostingClient {
  declare id: bigint;
  declare organizationId: bigint;
  declare clientName: string;
  declare contactPerson: string;
  declare email: string;
  declare phone: string;
  declare company: string;
  declare websiteDomain?: string;
  declare hostingType: 'Shared' | 'VPS' | 'Dedicated' | 'Cloud' | 'Other';
  declare serverLocation?: string;
  declare monthlyBillingAmount: number;
  declare billingCycle: 'Monthly' | 'Quarterly' | 'Annually';
  declare renewalDate: Date;
  declare status: 'Active' | 'Inactive' | 'Suspended' | 'Expired';
  declare assignedAccount?: bigint;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

HostingClient.init(
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
    clientName: {
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
    company: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    websiteDomain: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hostingType: {
      type: DataTypes.ENUM('Shared', 'VPS', 'Dedicated', 'Cloud', 'Other'),
      defaultValue: 'Shared',
    },
    serverLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    monthlyBillingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    billingCycle: {
      type: DataTypes.ENUM('Monthly', 'Quarterly', 'Annually'),
      defaultValue: 'Monthly',
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Suspended', 'Expired'),
      defaultValue: 'Active',
    },
    assignedAccount: {
      type: DataTypes.BIGINT,
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
    tableName: 'hosting_client',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['email'] },
      { fields: ['renewalDate'] },
      { fields: ['assignedAccount'] },
    ],
  }
);

export default HostingClient;
