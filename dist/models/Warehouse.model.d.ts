import { Model, Optional, Sequelize } from 'sequelize';
interface WarehouseAttributes {
    id: bigint;
    uuid: string;
    warehouseCode: string;
    warehouseName: string;
    locationId: bigint;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    managerUserId?: bigint;
    capacity?: number;
    isActive: boolean;
    deletedAt?: Date;
}
interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id' | 'uuid'> {
}
export declare class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
    id: bigint;
    uuid: string;
    warehouseCode: string;
    warehouseName: string;
    locationId: bigint;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    managerUserId?: bigint;
    capacity?: number;
    isActive: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Warehouse;
}
export {};
//# sourceMappingURL=Warehouse.model.d.ts.map