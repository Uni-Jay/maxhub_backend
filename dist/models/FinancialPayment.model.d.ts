import { Model } from 'sequelize';
export interface IFinancialPayment {
    id: bigint;
    organizationId: bigint;
    invoiceId?: bigint;
    paymentNumber: string;
    paymentDate: Date;
    paymentType: 'Income' | 'Expense' | 'Salary' | 'Vendor' | 'Other';
    amount: number;
    paymentMethod: 'Bank Transfer' | 'Check' | 'Cash' | 'Card' | 'Digital Wallet';
    transactionReference: string;
    paymentStatus: 'Pending' | 'Processed' | 'Completed' | 'Failed' | 'Cancelled';
    fromAccount?: string;
    toAccount?: string;
    bankName?: string;
    chequeNumber?: string;
    recipientName?: string;
    description?: string;
    processedBy?: bigint;
    approvedBy?: bigint;
    attachmentUrl?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class FinancialPayment extends Model<IFinancialPayment> implements IFinancialPayment {
    id: bigint;
    organizationId: bigint;
    invoiceId?: bigint;
    paymentNumber: string;
    paymentDate: Date;
    paymentType: 'Income' | 'Expense' | 'Salary' | 'Vendor' | 'Other';
    amount: number;
    paymentMethod: 'Bank Transfer' | 'Check' | 'Cash' | 'Card' | 'Digital Wallet';
    transactionReference: string;
    paymentStatus: 'Pending' | 'Processed' | 'Completed' | 'Failed' | 'Cancelled';
    fromAccount?: string;
    toAccount?: string;
    bankName?: string;
    chequeNumber?: string;
    recipientName?: string;
    description?: string;
    processedBy?: bigint;
    approvedBy?: bigint;
    attachmentUrl?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default FinancialPayment;
//# sourceMappingURL=FinancialPayment.model.d.ts.map