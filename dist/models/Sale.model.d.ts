import { Model } from 'sequelize';
export interface ISale {
    id: bigint;
    organizationId: bigint;
    customerId: bigint;
    saleDate: Date;
    saleNumber: string;
    productCategory: string;
    productDetails: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    discountPercentage?: number;
    discountAmount?: number;
    taxAmount: number;
    netAmount: number;
    saleStatus: 'Completed' | 'Partial' | 'Cancelled';
    paymentReceived: number;
    outstandingAmount: number;
    salesPerson?: bigint;
    paymentMode?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    paymentDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Sale extends Model<ISale> implements ISale {
    id: bigint;
    organizationId: bigint;
    customerId: bigint;
    saleDate: Date;
    saleNumber: string;
    productCategory: string;
    productDetails: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    discountPercentage?: number;
    discountAmount?: number;
    taxAmount: number;
    netAmount: number;
    saleStatus: 'Completed' | 'Partial' | 'Cancelled';
    paymentReceived: number;
    outstandingAmount: number;
    salesPerson?: bigint;
    paymentMode?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    paymentDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Sale;
//# sourceMappingURL=Sale.model.d.ts.map