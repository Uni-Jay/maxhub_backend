import { Model, Optional, Sequelize } from 'sequelize';
interface UserPermissionAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    permissionId: bigint;
    grantedAt: Date;
    expiresAt?: Date;
    reason?: string;
    deletedAt?: Date;
}
interface UserPermissionCreationAttributes extends Optional<UserPermissionAttributes, 'id' | 'uuid' | 'grantedAt'> {
}
export declare class UserPermission extends Model<UserPermissionAttributes, UserPermissionCreationAttributes> implements UserPermissionAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    permissionId: bigint;
    grantedAt: Date;
    expiresAt?: Date;
    reason?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof UserPermission;
    isExpired(): boolean;
}
export {};
//# sourceMappingURL=UserPermission.model.d.ts.map