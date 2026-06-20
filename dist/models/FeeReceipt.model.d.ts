import { Model, Optional, Sequelize } from 'sequelize';
interface FeeReceiptAttributes {
    id: bigint;
    uuid: string;
    enrollmentId: bigint;
    receiptNumber: string;
    amountPaid: number;
    paymentMethod: 'Cash' | 'BankTransfer' | 'POS' | 'Online';
    paymentDate: Date;
    session: string;
    term: 'First Term' | 'Second Term' | 'Third Term';
    status: 'Paid' | 'PartPayment' | 'Pending';
    notes?: string;
    issuedById: bigint;
    deletedAt?: Date;
}
interface FeeReceiptCreationAttributes extends Optional<FeeReceiptAttributes, 'id' | 'uuid'> {
}
export declare class FeeReceipt extends Model<FeeReceiptAttributes, FeeReceiptCreationAttributes> implements FeeReceiptAttributes {
    id: bigint;
    uuid: string;
    enrollmentId: bigint;
    receiptNumber: string;
    amountPaid: number;
    paymentMethod: 'Cash' | 'BankTransfer' | 'POS' | 'Online';
    paymentDate: Date;
    session: string;
    term: 'First Term' | 'Second Term' | 'Third Term';
    status: 'Paid' | 'PartPayment' | 'Pending';
    notes?: string;
    issuedById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof FeeReceipt;
}
export {};
//# sourceMappingURL=FeeReceipt.model.d.ts.map