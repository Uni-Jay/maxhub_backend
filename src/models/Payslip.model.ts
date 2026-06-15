import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

export interface IPayslip {
  id: bigint;
  organizationId: bigint;
  staffId: bigint;
  payrollId: bigint;
  payslipMonth: Date;
  baseSalary: number;
  allowances: number;
  grossSalary: number;
  providentFund: number;
  incomeTax: number;
  professionaltax: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: 'Pending' | 'Processed' | 'Paid' | 'Failed';
  paymentDate?: Date;
  paymentMethod?: 'Bank Transfer' | 'Check' | 'Cash' | 'Other';
  bankDetails?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Payslip extends Model<IPayslip> implements IPayslip {
  declare id: bigint;
  declare organizationId: bigint;
  declare staffId: bigint;
  declare payrollId: bigint;
  declare payslipMonth: Date;
  declare baseSalary: number;
  declare allowances: number;
  declare grossSalary: number;
  declare providentFund: number;
  declare incomeTax: number;
  declare professionaltax: number;
  declare otherDeductions: number;
  declare totalDeductions: number;
  declare netSalary: number;
  declare paymentStatus: 'Pending' | 'Processed' | 'Paid' | 'Failed';
  declare paymentDate?: Date;
  declare paymentMethod?: 'Bank Transfer' | 'Check' | 'Cash' | 'Other';
  declare bankDetails?: string;
  declare notes?: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

Payslip.init(
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
    staffId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    payrollId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    payslipMonth: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    baseSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    allowances: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    grossSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    providentFund: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    incomeTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    professionaltax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    otherDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    netSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('Pending', 'Processed', 'Paid', 'Failed'),
      defaultValue: 'Pending',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.ENUM('Bank Transfer', 'Check', 'Cash', 'Other'),
      allowNull: true,
    },
    bankDetails: {
      type: DataTypes.STRING(255),
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
    tableName: 'payslip',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'staffId'] },
      { fields: ['payrollId'] },
      { fields: ['payslipMonth'] },
    ],
  }
);

export default Payslip;
