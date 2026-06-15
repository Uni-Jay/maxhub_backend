import { Model, Optional, Sequelize } from 'sequelize';
interface InvoiceAttributes {
    id: bigint;
    uuid: string;
    invoiceCode: string;
    orderId?: bigint;
    accountId: bigint;
    invoiceDate: Date;
    dueDate: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    status: 'Draft' | 'Issued' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled';
    description?: string;
    createdById: bigint;
    deletedAt?: Date;
}
interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id' | 'uuid'> {
}
export declare class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
    id: bigint;
    uuid: string;
    invoiceCode: string;
    orderId?: bigint;
    accountId: bigint;
    invoiceDate: Date;
    dueDate: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    status: 'Draft' | 'Issued' | 'PartiallyPaid' | 'Paid' | 'Overdue' | 'Cancelled';
    description?: string;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Invoice;
}
export {};
//# sourceMappingURL=Invoice.model.d.ts.map