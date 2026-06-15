import { Model } from 'sequelize';
export interface IInventoryPurchaseOrderItem {
    id: bigint;
    organizationId: bigint;
    purchaseOrderId: bigint;
    inventoryId: bigint;
    lineNumber: number;
    quantity: number;
    unitPrice: number;
    amount: number;
    receivedQuantity: number;
    damagedQuantity?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class InventoryPurchaseOrderItem extends Model<IInventoryPurchaseOrderItem> implements IInventoryPurchaseOrderItem {
    id: bigint;
    organizationId: bigint;
    purchaseOrderId: bigint;
    inventoryId: bigint;
    lineNumber: number;
    quantity: number;
    unitPrice: number;
    amount: number;
    receivedQuantity: number;
    damagedQuantity?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default InventoryPurchaseOrderItem;
//# sourceMappingURL=InventoryPurchaseOrderItem.model.d.ts.map