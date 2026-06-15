import { Model, Optional, Sequelize } from 'sequelize';
interface SessionAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    refreshToken: string;
    accessTokenHash?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    deletedAt?: Date;
}
interface SessionCreationAttributes extends Optional<SessionAttributes, 'id' | 'uuid'> {
}
export declare class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    refreshToken: string;
    accessTokenHash?: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Session;
    isValid(): boolean;
}
export {};
//# sourceMappingURL=Session.model.d.ts.map