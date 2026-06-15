import { Model, Optional, Sequelize, BelongsToManyAddAssociationMixin, BelongsToManyRemoveAssociationMixin, BelongsToManyHasAssociationMixin, BelongsToManyCountAssociationsMixin, BelongsToManyGetAssociationsMixin } from 'sequelize';
interface RoleAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    isActive: boolean;
    deletedAt?: Date;
}
interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'uuid'> {
}
export declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    isActive: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    addPermission: BelongsToManyAddAssociationMixin<Permission, bigint>;
    removePermission: BelongsToManyRemoveAssociationMixin<Permission, bigint>;
    hasPermission: BelongsToManyHasAssociationMixin<Permission, bigint>;
    countPermissions: BelongsToManyCountAssociationsMixin;
    getPermissions: BelongsToManyGetAssociationsMixin<Permission>;
    static initModel(sequelize: Sequelize): typeof Role;
}
import type { Permission } from './Permission.model';
export {};
//# sourceMappingURL=Role.model.d.ts.map