import { Model } from 'sequelize';
export interface IPaymentAllocation {
    id: bigint;
    organizationId: bigint;
    paymentId: bigint;
    invoiceId: bigint;
    amountAllocated: number;
    allocationDate: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class PaymentAllocation extends Model<IPaymentAllocation> implements IPaymentAllocation {
    id: bigint;
    organizationId: bigint;
    paymentId: bigint;
    invoiceId: bigint;
    amountAllocated: number;
    allocationDate: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default PaymentAllocation;
//# sourceMappingURL=PaymentAllocation.model.d.ts.map