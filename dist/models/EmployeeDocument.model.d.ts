import { Model, Optional, Sequelize } from 'sequelize';
interface EmployeeDocumentAttributes {
    id: bigint;
    uuid: string;
    documentCode: string;
    staffId: bigint;
    documentType: 'Contract' | 'Letter' | 'Agreement' | 'Certification' | 'License' | 'Insurance' | 'Other';
    documentName: string;
    documentUrl: string;
    issueDate?: Date;
    expiryDate?: Date;
    status: 'Active' | 'Expired' | 'Archived' | 'Revoked';
    description?: string;
    uploadedBy: bigint;
    deletedAt?: Date;
}
interface EmployeeDocumentCreationAttributes extends Optional<EmployeeDocumentAttributes, 'id' | 'uuid'> {
}
export declare class EmployeeDocument extends Model<EmployeeDocumentAttributes, EmployeeDocumentCreationAttributes> implements EmployeeDocumentAttributes {
    id: bigint;
    uuid: string;
    documentCode: string;
    staffId: bigint;
    documentType: 'Contract' | 'Letter' | 'Agreement' | 'Certification' | 'License' | 'Insurance' | 'Other';
    documentName: string;
    documentUrl: string;
    issueDate?: Date;
    expiryDate?: Date;
    status: 'Active' | 'Expired' | 'Archived' | 'Revoked';
    description?: string;
    uploadedBy: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof EmployeeDocument;
}
export {};
//# sourceMappingURL=EmployeeDocument.model.d.ts.map