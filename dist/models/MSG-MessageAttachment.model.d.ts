import { Model } from 'sequelize';
export interface IMessageAttachment {
    id: bigint;
    organizationId: bigint;
    directMessageId?: bigint;
    chatMessageId?: bigint;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileExtension?: string;
    uploadedAt: Date;
    uploadedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class MessageAttachment extends Model<IMessageAttachment> implements IMessageAttachment {
    id: bigint;
    organizationId: bigint;
    directMessageId?: bigint;
    chatMessageId?: bigint;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileExtension?: string;
    uploadedAt: Date;
    uploadedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default MessageAttachment;
//# sourceMappingURL=MSG-MessageAttachment.model.d.ts.map