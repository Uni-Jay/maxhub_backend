import { Model } from 'sequelize';
export interface IInventoryPurchaseOrder {
    id: bigint;
    organizationId: bigint;
    supplierId: bigint;
    poNumber: string;
    poDate: Date;
    expectedDeliveryDate: Date;
    actualDeliveryDate?: Date;
    items: JSON;
    totalQuantity: number;
    subtotal: number;
    taxPercentage?: number;
    taxAmount?: number;
    shippingCost?: number;
    totalAmount: number;
    orderStatus: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Delivered' | 'Cancelled';
    paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
    paymentTerms?: string;
    deliveryAddress?: string;
    createdBy?: bigint;
    approvedBy?: bigint;
    approvalDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class InventoryPurchaseOrder extends Model<IInventoryPurchaseOrder> implements IInventoryPurchaseOrder {
    id: bigint;
    organizationId: bigint;
    supplierId: bigint;
    poNumber: string;
    poDate: Date;
    expectedDeliveryDate: Date;
    actualDeliveryDate?: Date;
    items: JSON;
    totalQuantity: number;
    subtotal: number;
    taxPercentage?: number;
    taxAmount?: number;
    shippingCost?: number;
    totalAmount: number;
    orderStatus: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Delivered' | 'Cancelled';
    paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
    paymentTerms?: string;
    deliveryAddress?: string;
    createdBy?: bigint;
    approvedBy?: bigint;
    approvalDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default InventoryPurchaseOrder;
//# sourceMappingURL=InventoryPurchaseOrder.model.d.ts.map