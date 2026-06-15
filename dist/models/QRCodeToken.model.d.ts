import { Model, Optional, Sequelize } from 'sequelize';
interface QRCodeTokenAttributes {
    id: bigint;
    uuid: string;
    organizationId: bigint;
    tokenHash: string;
    nonce: string;
    status: 'Active' | 'Used' | 'Expired' | 'Revoked';
    generatedBy: bigint;
    generatedAt: Date;
    expiresAt: Date;
    usedAt?: Date;
    usedBy?: bigint;
    usedAtLatitude?: number;
    usedAtLongitude?: number;
    geohashAtGeneration?: string;
    geohashAtUsage?: string;
    geohashValid: boolean;
    usageCount: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface QRCodeTokenCreationAttributes extends Optional<QRCodeTokenAttributes, 'id' | 'uuid'> {
}
export declare class QRCodeToken extends Model<QRCodeTokenAttributes, QRCodeTokenCreationAttributes> implements QRCodeTokenAttributes {
    id: bigint;
    uuid: string;
    organizationId: bigint;
    tokenHash: string;
    nonce: string;
    status: 'Active' | 'Used' | 'Expired' | 'Revoked';
    generatedBy: bigint;
    generatedAt: Date;
    expiresAt: Date;
    usedAt?: Date;
    usedBy?: bigint;
    usedAtLatitude?: number;
    usedAtLongitude?: number;
    geohashAtGeneration?: string;
    geohashAtUsage?: string;
    geohashValid: boolean;
    usageCount: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof QRCodeToken;
}
export {};
//# sourceMappingURL=QRCodeToken.model.d.ts.map