import { Model, Optional } from 'sequelize';
interface FileRecordAttributes {
    id: bigint;
    uuid: string;
    name: string;
    originalName?: string;
    path?: string;
    mimeType?: string;
    size: number;
    folderId?: string;
    isFolder: boolean;
    icon?: string;
    uploadedById?: bigint;
    uploadedByName?: string;
    deletedAt?: Date;
}
interface FileRecordCreationAttributes extends Optional<FileRecordAttributes, 'id' | 'uuid' | 'size' | 'isFolder'> {
}
export declare class FileRecord extends Model<FileRecordAttributes, FileRecordCreationAttributes> implements FileRecordAttributes {
    id: bigint;
    uuid: string;
    name: string;
    originalName?: string;
    path?: string;
    mimeType?: string;
    size: number;
    folderId?: string;
    isFolder: boolean;
    icon?: string;
    uploadedById?: bigint;
    uploadedByName?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default FileRecord;
//# sourceMappingURL=FileRecord.model.d.ts.map