import { Model } from 'sequelize';
export interface IRevenue {
    id: bigint;
    organizationId: bigint;
    revenueDate: Date;
    revenueSource: string;
    category: 'Sales' | 'Service' | 'Investment' | 'Other Income' | 'Rental';
    amount: number;
    description?: string;
    referenceNumber?: string;
    paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    invoiceNumber?: string;
    clientName?: string;
    recordedBy?: bigint;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Revenue extends Model<IRevenue> implements IRevenue {
    id: bigint;
    organizationId: bigint;
    revenueDate: Date;
    revenueSource: string;
    category: 'Sales' | 'Service' | 'Investment' | 'Other Income' | 'Rental';
    amount: number;
    description?: string;
    referenceNumber?: string;
    paymentMethod: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    invoiceNumber?: string;
    clientName?: string;
    recordedBy?: bigint;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Revenue;
//# sourceMappingURL=Revenue.model.d.ts.map