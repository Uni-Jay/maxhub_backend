import { Model } from 'sequelize';
export interface IInventory {
    id: bigint;
    organizationId: bigint;
    warehouseId?: bigint;
    itemName: string;
    sku: string;
    itemType: 'Bead' | 'Bag' | 'Material' | 'Office Equipment' | 'Tech Equipment' | 'Other';
    category: string;
    description?: string;
    unitOfMeasure: 'Piece' | 'Box' | 'Kg' | 'Meter' | 'Liter' | 'Pack';
    reorderLevel: number;
    reorderQuantity: number;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    unitCost: number;
    totalValue: number;
    lastRestockDate?: Date;
    supplier?: string;
    status: 'Active' | 'Inactive' | 'Discontinued' | 'Low Stock';
    location?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Inventory extends Model<IInventory> implements IInventory {
    id: bigint;
    organizationId: bigint;
    warehouseId?: bigint;
    itemName: string;
    sku: string;
    itemType: 'Bead' | 'Bag' | 'Material' | 'Office Equipment' | 'Tech Equipment' | 'Other';
    category: string;
    description?: string;
    unitOfMeasure: 'Piece' | 'Box' | 'Kg' | 'Meter' | 'Liter' | 'Pack';
    reorderLevel: number;
    reorderQuantity: number;
    currentStock: number;
    reservedStock: number;
    availableStock: number;
    unitCost: number;
    totalValue: number;
    lastRestockDate?: Date;
    supplier?: string;
    status: 'Active' | 'Inactive' | 'Discontinued' | 'Low Stock';
    location?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Inventory;
//# sourceMappingURL=Inventory.model.d.ts.map