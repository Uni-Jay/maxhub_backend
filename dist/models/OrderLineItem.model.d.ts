import { Model } from 'sequelize';
export interface IOrderLineItem {
    id: bigint;
    organizationId: bigint;
    orderId: bigint;
    inventoryId?: bigint;
    productId?: bigint;
    lineNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxPercentage?: number;
    taxAmount?: number;
    deliveredQuantity?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class OrderLineItem extends Model<IOrderLineItem> implements IOrderLineItem {
    id: bigint;
    organizationId: bigint;
    orderId: bigint;
    inventoryId?: bigint;
    productId?: bigint;
    lineNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    taxPercentage?: number;
    taxAmount?: number;
    deliveredQuantity?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default OrderLineItem;
//# sourceMappingURL=OrderLineItem.model.d.ts.map