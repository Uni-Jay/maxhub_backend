import { Model, Optional, Sequelize } from 'sequelize';
interface UserRoleAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    roleId: bigint;
    assignedAt: Date;
    expiresAt?: Date;
    deletedAt?: Date;
}
interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'uuid' | 'assignedAt'> {
}
export declare class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    roleId: bigint;
    assignedAt: Date;
    expiresAt?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof UserRole;
    isExpired(): boolean;
}
export {};
//# sourceMappingURL=UserRole.model.d.ts.map