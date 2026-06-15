import { Model, Optional, Sequelize } from 'sequelize';
interface InventoryCategoryAttributes {
    id: bigint;
    uuid: string;
    categoryCode: string;
    categoryName: string;
    description?: string;
    parentCategoryId?: bigint;
    isActive: boolean;
    deletedAt?: Date;
}
interface InventoryCategoryCreationAttributes extends Optional<InventoryCategoryAttributes, 'id' | 'uuid'> {
}
export declare class InventoryCategory extends Model<InventoryCategoryAttributes, InventoryCategoryCreationAttributes> implements InventoryCategoryAttributes {
    id: bigint;
    uuid: string;
    categoryCode: string;
    categoryName: string;
    description?: string;
    parentCategoryId?: bigint;
    isActive: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof InventoryCategory;
}
export {};
//# sourceMappingURL=InventoryCategory.model.d.ts.map