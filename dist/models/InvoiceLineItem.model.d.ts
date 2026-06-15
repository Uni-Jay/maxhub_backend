import { Model } from 'sequelize';
export interface IInvoiceLineItem {
    id: bigint;
    organizationId: bigint;
    invoiceId: bigint;
    productId?: bigint;
    lineNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxPercentage?: number;
    taxAmount?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class InvoiceLineItem extends Model<IInvoiceLineItem> implements IInvoiceLineItem {
    id: bigint;
    organizationId: bigint;
    invoiceId: bigint;
    productId?: bigint;
    lineNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxPercentage?: number;
    taxAmount?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default InvoiceLineItem;
//# sourceMappingURL=InvoiceLineItem.model.d.ts.map