import { Model, Optional, Sequelize } from 'sequelize';
interface PaymentAttributes {
    id: bigint;
    uuid: string;
    paymentCode: string;
    invoiceId?: bigint;
    accountId: bigint;
    paymentDate: Date;
    amount: number;
    currency: string;
    paymentMethod: 'Cash' | 'Cheque' | 'BankTransfer' | 'CreditCard' | 'Online' | 'Other';
    referenceNumber?: string;
    description?: string;
    status: 'Pending' | 'Processed' | 'Failed' | 'Cancelled';
    processedBy?: bigint;
    processedDate?: Date;
    deletedAt?: Date;
}
interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'uuid'> {
}
export declare class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
    id: bigint;
    uuid: string;
    paymentCode: string;
    invoiceId?: bigint;
    accountId: bigint;
    paymentDate: Date;
    amount: number;
    currency: string;
    paymentMethod: 'Cash' | 'Cheque' | 'BankTransfer' | 'CreditCard' | 'Online' | 'Other';
    referenceNumber?: string;
    description?: string;
    status: 'Pending' | 'Processed' | 'Failed' | 'Cancelled';
    processedBy?: bigint;
    processedDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Payment;
}
export {};
//# sourceMappingURL=Payment.model.d.ts.map