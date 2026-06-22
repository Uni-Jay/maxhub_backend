import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export type CustomerReportApprovalStatus =
  | 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Revision Requested' | 'Archived';

export interface CustomerReportNote { date: string; text: string; author: string }
export interface CustomerReportPayment { date: string; amount: number; description: string }

interface CustomerReportAttributes {
  id: bigint;
  uuid: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  assignedStaff?: string;
  servicePurchased: string;
  department?: string;
  businessUnit: string;
  currentStatus?: string;
  pendingActions?: string;
  completedActions?: string;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  notes: CustomerReportNote[];
  payments: CustomerReportPayment[];
  attachments: unknown[];
  approvalStatus: CustomerReportApprovalStatus;
  submittedBy?: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  revisionNote?: string;
  createdById: bigint;
  deletedAt?: Date;
}

interface CustomerReportCreationAttributes
  extends Optional<CustomerReportAttributes,
    | 'id' | 'uuid' | 'clientPhone' | 'clientEmail' | 'assignedStaff' | 'department'
    | 'currentStatus' | 'pendingActions' | 'completedActions'
    | 'totalAmount' | 'amountPaid' | 'outstandingBalance' | 'notes' | 'payments' | 'attachments'
    | 'approvalStatus' | 'submittedBy' | 'submittedAt' | 'approvedBy' | 'approvedAt'
    | 'rejectionReason' | 'revisionNote' | 'deletedAt'
  > {}

export class CustomerReport
  extends Model<CustomerReportAttributes, CustomerReportCreationAttributes>
  implements CustomerReportAttributes {
  declare id: bigint;
  declare uuid: string;
  declare clientName: string;
  declare clientPhone?: string;
  declare clientEmail?: string;
  declare assignedStaff?: string;
  declare servicePurchased: string;
  declare department?: string;
  declare businessUnit: string;
  declare currentStatus?: string;
  declare pendingActions?: string;
  declare completedActions?: string;
  declare totalAmount: number;
  declare amountPaid: number;
  declare outstandingBalance: number;
  declare notes: CustomerReportNote[];
  declare payments: CustomerReportPayment[];
  declare attachments: unknown[];
  declare approvalStatus: CustomerReportApprovalStatus;
  declare submittedBy?: string;
  declare submittedAt?: Date;
  declare approvedBy?: string;
  declare approvedAt?: Date;
  declare rejectionReason?: string;
  declare revisionNote?: string;
  declare createdById: bigint;
  declare deletedAt?: Date;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public static initModel(sequelize: Sequelize): typeof CustomerReport {
    CustomerReport.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        clientName: { type: DataTypes.STRING(200), allowNull: false },
        clientPhone: { type: DataTypes.STRING(30), allowNull: true },
        clientEmail: { type: DataTypes.STRING(200), allowNull: true },
        assignedStaff: { type: DataTypes.STRING(200), allowNull: true },
        servicePurchased: { type: DataTypes.STRING(255), allowNull: false },
        department: { type: DataTypes.STRING(200), allowNull: true },
        businessUnit: { type: DataTypes.STRING(100), allowNull: false },
        currentStatus: { type: DataTypes.TEXT, allowNull: true },
        pendingActions: { type: DataTypes.TEXT, allowNull: true },
        completedActions: { type: DataTypes.TEXT, allowNull: true },
        totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        amountPaid: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        outstandingBalance: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
        notes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        payments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        attachments: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        approvalStatus: {
          type: DataTypes.ENUM('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Revision Requested', 'Archived'),
          allowNull: false,
          defaultValue: 'Draft',
        },
        submittedBy: { type: DataTypes.STRING(200), allowNull: true },
        submittedAt: { type: DataTypes.DATE, allowNull: true },
        approvedBy: { type: DataTypes.STRING(200), allowNull: true },
        approvedAt: { type: DataTypes.DATE, allowNull: true },
        rejectionReason: { type: DataTypes.TEXT, allowNull: true },
        revisionNote: { type: DataTypes.TEXT, allowNull: true },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
        deletedAt: { type: DataTypes.DATE, allowNull: true },
      },
      {
        sequelize,
        tableName: 'customer_reports',
        paranoid: true,
        timestamps: true,
        underscored: false,
        freezeTableName: true,
        indexes: [
          { fields: ['businessUnit'] },
          { fields: ['approvalStatus'] },
          { fields: ['createdById'] },
        ],
      }
    );
    return CustomerReport;
  }
}

export default CustomerReport;
