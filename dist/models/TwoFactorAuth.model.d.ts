import { Model, Optional, Sequelize, BelongsToGetAssociationMixin } from 'sequelize';
interface TwoFactorAuthAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'BACKUP_CODES';
    secret?: string;
    qrCode?: string;
    phoneNumber?: string;
    isEnabled: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    backupCodes?: string;
    backupCodesUsed?: string;
    lastUsedAt?: Date;
    deletedAt?: Date;
}
interface TwoFactorAuthCreationAttributes extends Optional<TwoFactorAuthAttributes, 'id' | 'uuid' | 'isEnabled' | 'isVerified'> {
}
export declare class TwoFactorAuth extends Model<TwoFactorAuthAttributes, TwoFactorAuthCreationAttributes> implements TwoFactorAuthAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    method: 'TOTP' | 'SMS' | 'EMAIL' | 'BACKUP_CODES';
    secret?: string;
    qrCode?: string;
    phoneNumber?: string;
    isEnabled: boolean;
    isVerified: boolean;
    verifiedAt?: Date;
    backupCodes?: string;
    backupCodesUsed?: string;
    lastUsedAt?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    getUser: BelongsToGetAssociationMixin<any>;
    static initModel(sequelize: Sequelize): typeof TwoFactorAuth;
}
export {};
//# sourceMappingURL=TwoFactorAuth.model.d.ts.map