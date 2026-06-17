import { Model, Optional, Sequelize } from 'sequelize';
interface UnitAttributes {
    id: bigint;
    uuid: string;
    name: string;
    code: string;
    description?: string;
    branchId?: bigint;
    headUserId?: bigint;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
}
interface UnitCreationAttributes extends Optional<UnitAttributes, 'id' | 'uuid'> {
}
export declare class Unit extends Model<UnitAttributes, UnitCreationAttributes> implements UnitAttributes {
    id: bigint;
    uuid: string;
    name: string;
    code: string;
    description?: string;
    branchId?: bigint;
    headUserId?: bigint;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Unit;
}
export {};
//# sourceMappingURL=Unit.model.d.ts.map