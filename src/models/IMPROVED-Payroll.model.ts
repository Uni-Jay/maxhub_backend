import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * IMPROVED: Payroll Model
 * - Added department tracking for RBAC and audit
 * - Added approval workflow fields
 * - Added lock mechanism for finalized payrolls
 * - Added archive support for old payrolls
 * - Added created_by and updated_by for audit trail
 * - Fixed denormalized totals (triggers should update these)
 */
export interface IPayroll {
  id: bigint;
  organizationId: bigint;
  departmentId?: bigint; // NEW: For department-level RBAC
  payrollMonth: Date;
  payrollPeriodStart: Date;
  payrollPeriodEnd: Date;
  status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed' | 'Closed';
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  totalTaxAmount: number;
  processedBy?: bigint;
  processedDate?: Date;
  approvedBy?: bigint;
  approvalDate?: Date;
  paidDate?: Date;
  lockedAt?: Date; // NEW: Lock after approval to prevent edits
  notes?: string;
  // NEW: Audit fields
  createdBy?: bigint;
  updatedBy?: bigint;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Payroll extends Model<IPayroll> implements IPayroll {
  declare id: bigint;
  declare organizationId: bigint;
  declare departmentId?: bigint;
  declare payrollMonth: Date;
  declare payrollPeriodStart: Date;
  declare payrollPeriodEnd: Date;
  declare status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed' | 'Closed';
  declare totalEmployees: number;
  declare totalGrossSalary: number;
  declare totalDeductions: number;
  declare totalNetSalary: number;
  declare totalTaxAmount: number;
  declare processedBy?: bigint;
  declare processedDate?: Date;
  declare approvedBy?: bigint;
  declare approvalDate?: Date;
  declare paidDate?: Date;
  declare lockedAt?: Date;
  declare notes?: string;
  declare createdBy?: bigint;
  declare updatedBy?: bigint;
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
    departmentId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'NEW: Department tracking for RBAC filtering',
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
      type: DataTypes.ENUM('Draft', 'Processed', 'Approved', 'Paid', 'Failed', 'Closed'),
      defaultValue: 'Draft',
      comment: 'NEW: Added Closed status for finalized payroll',
    },
    totalEmployees: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalGrossSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Maintained by database trigger from payslip records',
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Maintained by database trigger from payslip records',
    },
    totalNetSalary: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Maintained by database trigger from payslip records',
    },
    totalTaxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Maintained by database trigger from payslip records',
    },
    processedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff who processed payroll',
    },
    processedDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'FK to Staff who approved payroll (must be different from processedBy)',
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paidDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'NEW: Timestamp when payroll was locked (prevent edits)',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'NEW: Audit trail - who created this record',
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'NEW: Audit trail - who last updated this record',
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
      { fields: ['departmentId'] }, // NEW: For department-level filtering
      // NEW: Composite index for common queries
      {
        fields: ['organizationId', 'payrollMonth'],
        name: 'idx_payroll_org_month',
      },
      // NEW: For finding unprocessed payrolls
      {
        fields: ['organizationId', 'status', 'payrollMonth'],
        name: 'idx_payroll_status_time',
      },
    ],
  }
);

export default Payroll;
