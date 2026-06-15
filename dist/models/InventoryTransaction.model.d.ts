import { Model } from 'sequelize';
export interface IInventoryTransaction {
    id: bigint;
    organizationId: bigint;
    inventoryId: bigint;
    warehouseId?: bigint;
    transactionType: 'In' | 'Out' | 'Adjustment' | 'Return' | 'Damage' | 'Count';
    quantity: number;
    unitCost?: number;
    transactionAmount?: number;
    referenceType?: 'PurchaseOrder' | 'Sale' | 'Order' | 'Manual' | 'CountAdjustment';
    referenceId?: bigint;
    notes?: string;
    recordedBy?: bigint;
    recordedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class InventoryTransaction extends Model<IInventoryTransaction> implements IInventoryTransaction {
    id: bigint;
    organizationId: bigint;
    inventoryId: bigint;
    warehouseId?: bigint;
    transactionType: 'In' | 'Out' | 'Adjustment' | 'Return' | 'Damage' | 'Count';
    quantity: number;
    unitCost?: number;
    transactionAmount?: number;
    referenceType?: 'PurchaseOrder' | 'Sale' | 'Order' | 'Manual' | 'CountAdjustment';
    referenceId?: bigint;
    notes?: string;
    recordedBy?: bigint;
    recordedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default InventoryTransaction;
//# sourceMappingURL=InventoryTransaction.model.d.ts.map