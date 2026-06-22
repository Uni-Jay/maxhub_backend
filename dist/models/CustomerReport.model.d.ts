import { Model, Optional, Sequelize } from 'sequelize';
export type CustomerReportApprovalStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Revision Requested' | 'Archived';
export interface CustomerReportNote {
    date: string;
    text: string;
    author: string;
}
export interface CustomerReportPayment {
    date: string;
    amount: number;
    description: string;
}
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
interface CustomerReportCreationAttributes extends Optional<CustomerReportAttributes, 'id' | 'uuid' | 'clientPhone' | 'clientEmail' | 'assignedStaff' | 'department' | 'currentStatus' | 'pendingActions' | 'completedActions' | 'totalAmount' | 'amountPaid' | 'outstandingBalance' | 'notes' | 'payments' | 'attachments' | 'approvalStatus' | 'submittedBy' | 'submittedAt' | 'approvedBy' | 'approvedAt' | 'rejectionReason' | 'revisionNote' | 'deletedAt'> {
}
export declare class CustomerReport extends Model<CustomerReportAttributes, CustomerReportCreationAttributes> implements CustomerReportAttributes {
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
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof CustomerReport;
}
export default CustomerReport;
//# sourceMappingURL=CustomerReport.model.d.ts.map