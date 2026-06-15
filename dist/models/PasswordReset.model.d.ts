import { Model, Optional, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
interface PasswordResetAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    email: string;
    token: string;
    tokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    isUsed: boolean;
    usedAt?: Date;
    expiresAt: Date;
    deletedAt?: Date;
}
interface PasswordResetCreationAttributes extends Optional<PasswordResetAttributes, 'id' | 'uuid' | 'isUsed'> {
}
export declare class PasswordReset extends Model<PasswordResetAttributes, PasswordResetCreationAttributes> implements PasswordResetAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    email: string;
    token: string;
    tokenHash: string;
    ipAddress?: string;
    userAgent?: string;
    isUsed: boolean;
    usedAt?: Date;
    expiresAt: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    getUser: BelongsToGetAssociationMixin<any>;
    static initModel(sequelize: Sequelize): typeof PasswordReset;
}
export {};
//# sourceMappingURL=PasswordReset.model.d.ts.map