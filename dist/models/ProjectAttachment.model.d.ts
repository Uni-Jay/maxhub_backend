import { Model, Optional, Sequelize } from 'sequelize';
interface ProjectAttachmentAttributes {
    id: bigint;
    uuid: string;
    projectId?: bigint;
    taskId?: bigint;
    commentId?: bigint;
    staffId: bigint;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    s3Key?: string;
    attachmentType: 'Document' | 'Image' | 'Video' | 'Audio' | 'Other';
    description?: string;
    uploadedAt: Date;
    downloadCount: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface ProjectAttachmentCreationAttributes extends Optional<ProjectAttachmentAttributes, 'id' | 'uuid'> {
}
export declare class ProjectAttachment extends Model<ProjectAttachmentAttributes, ProjectAttachmentCreationAttributes> implements ProjectAttachmentAttributes {
    id: bigint;
    uuid: string;
    projectId?: bigint;
    taskId?: bigint;
    commentId?: bigint;
    staffId: bigint;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    s3Key?: string;
    attachmentType: 'Document' | 'Image' | 'Video' | 'Audio' | 'Other';
    description?: string;
    uploadedAt: Date;
    downloadCount: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof ProjectAttachment;
}
export {};
//# sourceMappingURL=ProjectAttachment.model.d.ts.map