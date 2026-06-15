import { Model, Optional, Sequelize } from 'sequelize';
interface QuoteAttributes {
    id: bigint;
    uuid: string;
    quoteCode: string;
    opportunityId?: bigint;
    accountId?: bigint;
    contactId?: bigint;
    quoteDate: Date;
    validUntil: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
    description?: string;
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
    quoteDate: Date;
    validUntil: Date;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
    status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
    description?: string;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Quote;
}
export {};
//# sourceMappingURL=Quote.model.d.ts.map