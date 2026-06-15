import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IPayroll {
  id: bigint;
  organizationId: bigint;
  payrollMonth: Date;
  payrollPeriodStart: Date;
  payrollPeriodEnd: Date;
  status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed';
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalTaxAmount: number;
  processedBy?: bigint;
  approvedBy?: bigint;
  processedDate?: Date;
  approvedDate?: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Payroll extends Model<IPayroll> implements IPayroll {
  declare id: bigint;
  declare organizationId: bigint;
  declare payrollMonth: Date;
  declare payrollPeriodStart: Date;
  declare payrollPeriodEnd: Date;
  declare status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed';
  declare totalEmployees: number;
  declare totalGrossSalary: number;
  declare totalDeductions: number;
  declare totalNetSalary: number;
  declare totalTaxAmount: number;
  declare processedBy?: bigint;
  declare approvedBy?: bigint;
  declare processedDate?: Date;
  declare approvedDate?: Date;
  declare paidDate?: Date;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Payroll.init(
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
    payrollMonth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    payrollPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    payrollPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Draft', 'Processed', 'Approved', 'Paid', 'Failed'),
      defaultValue: 'Draft',
    },
    totalEmployees: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalGrossSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    totalNetSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    totalTaxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    processedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    processedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidDate: {
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
    tableName: 'payroll',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'status'] },
      { fields: ['payrollMonth'] },
    ],
  }
);

export default Payroll;
