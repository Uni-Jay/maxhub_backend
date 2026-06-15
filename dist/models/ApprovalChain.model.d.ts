import { Model } from 'sequelize';
export interface IApprovalChain {
    id: bigint;
    organizationId: bigint;
    workflowName: string;
    entityType: 'Payroll' | 'Expense' | 'PurchaseOrder' | 'Invoice' | 'Leave' | 'Other';
    approvalLevel: number;
    approverRoleId: bigint;
    minAmount?: number;
    maxAmount?: number;
    departmentId?: bigint;
    requiresAll?: boolean;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class ApprovalChain extends Model<IApprovalChain> implements IApprovalChain {
    id: bigint;
    organizationId: bigint;
    workflowName: string;
    entityType: 'Payroll' | 'Expense' | 'PurchaseOrder' | 'Invoice' | 'Leave' | 'Other';
    approvalLevel: number;
    approverRoleId: bigint;
    minAmount?: number;
    maxAmount?: number;
    departmentId?: bigint;
    requiresAll?: boolean;
    status: 'Active' | 'Inactive';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default ApprovalChain;
//# sourceMappingURL=ApprovalChain.model.d.ts.map