import { Model } from 'sequelize';
export interface IFinancialInvoice {
    id: bigint;
    organizationId: bigint;
    clientId?: string;
    clientName: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    description: string;
    subtotal: number;
    taxPercentage?: number;
    taxAmount?: number;
    discountPercentage?: number;
    discountAmount?: number;
    totalAmount: number;
    amountPaid: number;
    remainingAmount: number;
    status: 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
    paymentTerms?: string;
    issuedBy?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class FinancialInvoice extends Model<IFinancialInvoice> implements IFinancialInvoice {
    id: bigint;
    organizationId: bigint;
    clientId?: string;
    clientName: string;
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    description: string;
    subtotal: number;
    taxPercentage?: number;
    taxAmount?: number;
    discountPercentage?: number;
    discountAmount?: number;
    totalAmount: number;
    amountPaid: number;
    remainingAmount: number;
    status: 'Draft' | 'Sent' | 'Partial' | 'Paid' | 'Overdue' | 'Cancelled';
    paymentTerms?: string;
    issuedBy?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default FinancialInvoice;
//# sourceMappingURL=FinancialInvoice.model.d.ts.map