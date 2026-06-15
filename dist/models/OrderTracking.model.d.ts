import { Model } from 'sequelize';
export interface IOrderTracking {
    id: bigint;
    organizationId: bigint;
    customerId: bigint;
    orderDate: Date;
    orderNumber: string;
    totalAmount: number;
    discountAmount?: number;
    taxAmount: number;
    finalAmount: number;
    orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
    paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    shippingAddress?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    shippingTrackingNumber?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class OrderTracking extends Model<IOrderTracking> implements IOrderTracking {
    id: bigint;
    organizationId: bigint;
    customerId: bigint;
    orderDate: Date;
    orderNumber: string;
    totalAmount: number;
    discountAmount?: number;
    taxAmount: number;
    finalAmount: number;
    orderStatus: 'New' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
    paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    paymentMethod?: 'Cash' | 'Card' | 'Transfer' | 'Cheque';
    shippingAddress?: string;
    estimatedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    shippingTrackingNumber?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default OrderTracking;
//# sourceMappingURL=OrderTracking.model.d.ts.map