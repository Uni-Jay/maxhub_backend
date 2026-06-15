import { Model, Optional, Sequelize } from 'sequelize';
interface CertificateAttributes {
    id: bigint;
    uuid: string;
    enrollmentId: bigint;
    certificateCode: string;
    certificateName: string;
    issuedDate: Date;
    expiryDate?: Date;
    certificateUrl?: string;
    verificationCode: string;
    status: 'Issued' | 'Revoked' | 'Expired';
    revokedReason?: string;
    revokedDate?: Date;
    deletedAt?: Date;
}
interface CertificateCreationAttributes extends Optional<CertificateAttributes, 'id' | 'uuid'> {
}
export declare class Certificate extends Model<CertificateAttributes, CertificateCreationAttributes> implements CertificateAttributes {
    id: bigint;
    uuid: string;
    enrollmentId: bigint;
    certificateCode: string;
    certificateName: string;
    issuedDate: Date;
    expiryDate?: Date;
    certificateUrl?: string;
    verificationCode: string;
    status: 'Issued' | 'Revoked' | 'Expired';
    revokedReason?: string;
    revokedDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Certificate;
}
export {};
//# sourceMappingURL=Certificate.model.d.ts.map