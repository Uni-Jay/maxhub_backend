import { Model } from 'sequelize';
export interface ICertificate {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    studentId: bigint;
    certificateNumber: string;
    issuanceDate: Date;
    expiryDate?: Date;
    certificateUrl?: string;
    certificateHash?: string;
    status: 'Active' | 'Revoked' | 'Expired';
    issuerName?: string;
    issuerSignature?: string;
    verificationUrl?: string;
    notes?: string;
    createdBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Certificate extends Model<ICertificate> implements ICertificate {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    studentId: bigint;
    certificateNumber: string;
    issuanceDate: Date;
    expiryDate?: Date;
    certificateUrl?: string;
    certificateHash?: string;
    status: 'Active' | 'Revoked' | 'Expired';
    issuerName?: string;
    issuerSignature?: string;
    verificationUrl?: string;
    notes?: string;
    createdBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Certificate;
//# sourceMappingURL=LMS-Certificate.model.d.ts.map