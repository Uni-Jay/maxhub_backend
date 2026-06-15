import { Model } from 'sequelize';
export interface IOrderTracking {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    customerId: bigint;
    orderDate: Date;
    orderNumber: string;
    invoiceId?: bigint;
    totalAmount: number;
    discountAmount?: number;
    taxAmount: number;
    finalAmount: number;
    orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Partial' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
    paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Failed' | 'Refunded';
    paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque' | 'Digital Wallet';
    shippingAddress?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    shippingTrackingNumber?: string;
    totalItemsOrdered?: number;
    totalItemsDelivered?: number;
    createdBy?: bigint;
    updatedBy?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class OrderTracking extends Model<IOrderTracking> implements IOrderTracking {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    customerId: bigint;
    orderDate: Date;
    orderNumber: string;
    invoiceId?: bigint;
    totalAmount: number;
    discountAmount?: number;
    taxAmount: number;
    finalAmount: number;
    orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Partial' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
    paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Failed' | 'Refunded';
    paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque' | 'Digital Wallet';
    shippingAddress?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    shippingTrackingNumber?: string;
    totalItemsOrdered?: number;
    totalItemsDelivered?: number;
    createdBy?: bigint;
    updatedBy?: bigint;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default OrderTracking;
//# sourceMappingURL=IMPROVED-OrderTracking.model.d.ts.map