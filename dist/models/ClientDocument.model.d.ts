import { Model, Sequelize, Optional } from 'sequelize';
export type DocumentCategory = 'Passport' | 'Certificate' | 'Visa' | 'AdmissionLetter' | 'EmploymentDocument' | 'Contract' | 'IdentityDocument' | 'Other';
export interface ClientDocumentAttributes {
    id: bigint;
    uuid: string;
    clientId: bigint;
    documentName: string;
    category: DocumentCategory;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    version: number;
    description?: string;
    uploadedByUserId: bigint;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface ClientDocumentCreationAttributes extends Optional<ClientDocumentAttributes, 'id' | 'uuid' | 'fileSize' | 'mimeType' | 'version' | 'description' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class ClientDocument extends Model<ClientDocumentAttributes, ClientDocumentCreationAttributes> implements ClientDocumentAttributes {
    id: bigint;
    uuid: string;
    clientId: bigint;
    documentName: string;
    category: DocumentCategory;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    version: number;
    description?: string;
    uploadedByUserId: bigint;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date;
    static initModel(sequelize: Sequelize): void;
}
export default ClientDocument;
//# sourceMappingURL=ClientDocument.model.d.ts.map