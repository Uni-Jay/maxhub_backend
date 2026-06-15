import { Model } from 'sequelize';
export interface IFinancialExpense {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    expenseDate: Date;
    expenseCategory: 'Salary' | 'Utilities' | 'Rent' | 'Supplies' | 'Maintenance' | 'Travel' | 'Other';
    description: string;
    amount: number;
    vendorName?: string;
    vendorInvoiceNumber?: string;
    paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    paymentStatus: 'Pending' | 'Paid' | 'Failed';
    paymentDate?: Date;
    attachmentUrl?: string;
    requestedBy?: bigint;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    approvalDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class FinancialExpense extends Model<IFinancialExpense> implements IFinancialExpense {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    expenseDate: Date;
    expenseCategory: 'Salary' | 'Utilities' | 'Rent' | 'Supplies' | 'Maintenance' | 'Travel' | 'Other';
    description: string;
    amount: number;
    vendorName?: string;
    vendorInvoiceNumber?: string;
    paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    paymentStatus: 'Pending' | 'Paid' | 'Failed';
    paymentDate?: Date;
    attachmentUrl?: string;
    requestedBy?: bigint;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    approvalDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default FinancialExpense;
//# sourceMappingURL=FinancialExpense.model.d.ts.map