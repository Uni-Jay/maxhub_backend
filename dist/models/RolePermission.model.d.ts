import { Model, Optional, Sequelize } from 'sequelize';
interface RolePermissionAttributes {
    id: bigint;
    uuid: string;
    roleId: bigint;
    permissionId: bigint;
    deletedAt?: Date;
}
interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'id' | 'uuid'> {
}
export declare class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
    id: bigint;
    uuid: string;
    roleId: bigint;
    permissionId: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof RolePermission;
}
export {};
//# sourceMappingURL=RolePermission.model.d.ts.map