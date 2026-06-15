import { Model, Optional, Sequelize } from 'sequelize';
interface PermissionAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    module: string;
    resource: string;
    action: string;
    scope: 'all' | 'own' | 'own_department';
    isActive: boolean;
    deletedAt?: Date;
}
interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'uuid'> {
}
export declare class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    module: string;
    resource: string;
    action: string;
    scope: 'all' | 'own' | 'own_department';
    isActive: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Permission;
}
export {};
//# sourceMappingURL=Permission.model.d.ts.map