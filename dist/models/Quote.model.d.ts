import { Model, Optional, Sequelize } from 'sequelize';
interface QuoteLineItem {
    description: string;
    qty: number;
    unitPrice: number;
}
interface QuoteAttributes {
    id: bigint;
    uuid: string;
    quoteCode: string;
    opportunityId?: bigint;
    accountId?: bigint;
    contactId?: bigint;
    clientId?: bigint;
    departmentId?: bigint;
    title?: string;
    scopeOfWork?: string;
    termsAndConditions?: string;
    items?: QuoteLineItem[];
    quoteDate: Date;
    validUntil: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
    description?: string;
    sentAt?: Date;
    respondedAt?: Date;
    createdById: bigint;
    deletedAt?: Date;
}
interface QuoteCreationAttributes extends Optional<QuoteAttributes, 'id' | 'uuid'> {
}
export declare class Quote extends Model<QuoteAttributes, QuoteCreationAttributes> implements QuoteAttributes {
    id: bigint;
    uuid: string;
    quoteCode: string;
    opportunityId?: bigint;
    accountId?: bigint;
    contactId?: bigint;
    clientId?: bigint;
    departmentId?: bigint;
    title?: string;
    scopeOfWork?: string;
    termsAndConditions?: string;
    items?: QuoteLineItem[];
    quoteDate: Date;
    validUntil: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
    description?: string;
    sentAt?: Date;
    respondedAt?: Date;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Quote;
}
export {};
//# sourceMappingURL=Quote.model.d.ts.map