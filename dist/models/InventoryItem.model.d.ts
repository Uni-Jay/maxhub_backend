import { Model, Optional, Sequelize } from 'sequelize';
interface InventoryItemAttributes {
    id: bigint;
    uuid: string;
    itemCode: string;
    itemName: string;
    categoryId: bigint;
    description?: string;
    sku?: string;
    unitOfMeasure: string;
    unitCost: number;
    reorderLevel: number;
    reorderQuantity: number;
    status: 'Active' | 'Inactive' | 'Discontinued';
    isSerializable: boolean;
    isBatchable: boolean;
    deletedAt?: Date;
}
interface InventoryItemCreationAttributes extends Optional<InventoryItemAttributes, 'id' | 'uuid'> {
}
export declare class InventoryItem extends Model<InventoryItemAttributes, InventoryItemCreationAttributes> implements InventoryItemAttributes {
    id: bigint;
    uuid: string;
    itemCode: string;
    itemName: string;
    categoryId: bigint;
    description?: string;
    sku?: string;
    unitOfMeasure: string;
    unitCost: number;
    reorderLevel: number;
    reorderQuantity: number;
    status: 'Active' | 'Inactive' | 'Discontinued';
    isSerializable: boolean;
    isBatchable: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof InventoryItem;
}
export {};
//# sourceMappingURL=InventoryItem.model.d.ts.map