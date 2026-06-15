import { Model } from 'sequelize';
export interface IInventoryLocation {
    id: bigint;
    organizationId: bigint;
    inventoryId: bigint;
    warehouseId: bigint;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    binLocation?: string;
    lastCountDate?: Date;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderPoint?: number;
    updatedAt: Date;
}
export declare class InventoryLocation extends Model<IInventoryLocation> implements IInventoryLocation {
    id: bigint;
    organizationId: bigint;
    inventoryId: bigint;
    warehouseId: bigint;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    binLocation?: string;
    lastCountDate?: Date;
    minStockLevel?: number;
    maxStockLevel?: number;
    reorderPoint?: number;
    updatedAt: Date;
}
export default InventoryLocation;
//# sourceMappingURL=InventoryLocation.model.d.ts.map