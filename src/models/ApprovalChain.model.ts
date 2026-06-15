import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/Database';

/**
 * CRITICAL NEW TABLE: ApprovalChain
 * Enables: Workflow automation, segregation of duties, approval enforcement
 * Replaces: Hardcoded approval logic, manual workflow tracking
 * RBAC: Defines who can approve what based on amount/department
 */
export interface IApprovalChain {
  id: bigint;
  organizationId: bigint;
  workflowName: string;
  entityType: 'Payroll' | 'Expense' | 'PurchaseOrder' | 'Invoice' | 'Leave' | 'Other';
  approvalLevel: number;
  approverRoleId: bigint;
  minAmount?: number;
  maxAmount?: number;
  departmentId?: bigint; // null = applies to all departments
  requiresAll?: boolean; // true = all approvers at level, false = any one
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class ApprovalChain extends Model<IApprovalChain> implements IApprovalChain {
  declare id: bigint;
  declare organizationId: bigint;
  declare workflowName: string;
  declare entityType: 'Payroll' | 'Expense' | 'PurchaseOrder' | 'Invoice' | 'Leave' | 'Other';
  declare approvalLevel: number;
  declare approverRoleId: bigint;
  declare minAmount?: number;
  declare maxAmount?: number;
  declare departmentId?: bigint;
  declare requiresAll?: boolean;
  declare status: 'Active' | 'Inactive';
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt?: Date;
}

ApprovalChain.init(
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
    workflowName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entityType: {
      type: DataTypes.ENUM('Payroll', 'Expense', 'PurchaseOrder', 'Invoice', 'Leave', 'Other'),
      allowNull: false,
    },
    approvalLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '1=first approver, 2=second, etc',
    },
    approverRoleId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'FK to role table: which role can approve',
    },
    minAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Minimum amount requiring this approval level',
    },
    maxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Maximum amount this approval level can handle',
    },
    departmentId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Null = applies to all departments',
    },
    requiresAll: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'true = all approvers required, false = any one',
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
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
    tableName: 'approval_chain',
    paranoid: true,
    timestamps: true,
    indexes: [
      { fields: ['organizationId', 'entityType'] },
      { fields: ['approvalLevel'] },
      { fields: ['approverRoleId'] },
      // For finding applicable workflows
      {
        fields: ['organizationId', 'entityType', 'approvalLevel'],
        name: 'idx_approval_chain_lookup',
      },
    ],
  }
);

export default ApprovalChain;
