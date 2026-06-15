import { Model, Optional, Sequelize } from 'sequelize';
interface StaffDocumentAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    documentType: 'Passport' | 'NationalID' | 'Visa' | 'DrivingLicense' | 'Insurance' | 'HealthCertificate' | 'Other';
    documentName: string;
    documentNumber?: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuedBy?: string;
    documentUrl: string;
    status: 'Active' | 'Expired' | 'Archived';
    deletedAt?: Date;
}
interface StaffDocumentCreationAttributes extends Optional<StaffDocumentAttributes, 'id' | 'uuid'> {
}
export declare class StaffDocument extends Model<StaffDocumentAttributes, StaffDocumentCreationAttributes> implements StaffDocumentAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    documentType: 'Passport' | 'NationalID' | 'Visa' | 'DrivingLicense' | 'Insurance' | 'HealthCertificate' | 'Other';
    documentName: string;
    documentNumber?: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuedBy?: string;
    documentUrl: string;
    status: 'Active' | 'Expired' | 'Archived';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StaffDocument;
    isExpired(): boolean;
    daysUntilExpiry(): number | null;
}
export {};
//# sourceMappingURL=StaffDocument.model.d.ts.map