import { Model, Optional, Sequelize, BelongsToManyAddAssociationMixin, BelongsToManyRemoveAssociationMixin, BelongsToManyHasAssociationMixin, BelongsToManyCountAssociationsMixin, BelongsToManyGetAssociationsMixin } from 'sequelize';
interface UserAttributes {
    id: bigint;
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    passwordHash: string;
    status: 'Active' | 'Inactive' | 'Suspended';
    emailVerified: boolean;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
    deletedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'uuid' | 'emailVerified' | 'loginAttempts'> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: bigint;
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    passwordHash: string;
    status: 'Active' | 'Inactive' | 'Suspended';
    emailVerified: boolean;
    emailVerifiedAt?: Date;
    lastLoginAt?: Date;
    loginAttempts: number;
    lockedUntil?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    addRole: BelongsToManyAddAssociationMixin<Role, bigint>;
    removeRole: BelongsToManyRemoveAssociationMixin<Role, bigint>;
    hasRole: BelongsToManyHasAssociationMixin<Role, bigint>;
    countRoles: BelongsToManyCountAssociationsMixin;
    getRoles: BelongsToManyGetAssociationsMixin<Role>;
    addPermission: BelongsToManyAddAssociationMixin<Permission, bigint>;
    removePermission: BelongsToManyRemoveAssociationMixin<Permission, bigint>;
    hasPermission: BelongsToManyHasAssociationMixin<Permission, bigint>;
    countPermissions: BelongsToManyCountAssociationsMixin;
    getPermissions: BelongsToManyGetAssociationsMixin<Permission>;
    static initModel(sequelize: Sequelize): typeof User;
    getFullName(): string;
    isLocked(): boolean;
}
import type { Role } from './Role.model';
import type { Permission } from './Permission.model';
export {};
//# sourceMappingURL=User.model.d.ts.map