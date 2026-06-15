import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface ISoftwareClient {
  id: bigint;
  organizationId: bigint;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  company: string;
  industryType?: string;
  softwareProjects?: number;
  currentProjectCount: number;
  totalProjectValue: number;
  contractStartDate: Date;
  contractEndDate?: Date;
  status: 'Active' | 'Inactive' | 'Suspended' | 'Terminated';
  assignedAccount?: bigint; // Staff ID
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class SoftwareClient extends Model<ISoftwareClient> implements ISoftwareClient {
  declare id: bigint;
  declare organizationId: bigint;
  declare clientName: string;
  declare contactPerson: string;
  declare email: string;
  declare phone: string;
  declare company: string;
  declare industryType?: string;
  declare softwareProjects?: number;
  declare currentProjectCount: number;
  declare totalProjectValue: number;
  declare contractStartDate: Date;
  declare contractEndDate?: Date;
  declare status: 'Active' | 'Inactive' | 'Suspended' | 'Terminated';
  declare assignedAccount?: bigint;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

SoftwareClient.init(
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
    industryType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    softwareProjects: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    currentProjectCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalProjectValue: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    contractEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Suspended', 'Terminated'),
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
    tableName: 'software_client',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['email'] },
      { fields: ['assignedAccount'] },
    ],
  }
);

export default SoftwareClient;
