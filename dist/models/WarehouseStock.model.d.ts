import { Model, Optional, Sequelize } from 'sequelize';
interface WarehouseStockAttributes {
    id: bigint;
    uuid: string;
    warehouseId: bigint;
    itemId: bigint;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    lastCountDate?: Date;
    lastReceivedDate?: Date;
    deletedAt?: Date;
}
interface WarehouseStockCreationAttributes extends Optional<WarehouseStockAttributes, 'id' | 'uuid'> {
}
export declare class WarehouseStock extends Model<WarehouseStockAttributes, WarehouseStockCreationAttributes> implements WarehouseStockAttributes {
    id: bigint;
    uuid: string;
    warehouseId: bigint;
    itemId: bigint;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    lastCountDate?: Date;
    lastReceivedDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof WarehouseStock;
}
export {};
//# sourceMappingURL=WarehouseStock.model.d.ts.map