import { Model } from 'sequelize';
export interface IDirectMessage {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    senderId: bigint;
    recipientId: bigint;
    messageText: string;
    messageType: 'Text' | 'File' | 'Image' | 'Voice';
    status: 'Sent' | 'Delivered' | 'Read';
    sentAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    parentMessageId?: bigint;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAtSoft?: Date;
}
export declare class DirectMessage extends Model<IDirectMessage> implements IDirectMessage {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    senderId: bigint;
    recipientId: bigint;
    messageText: string;
    messageType: 'Text' | 'File' | 'Image' | 'Voice';
    status: 'Sent' | 'Delivered' | 'Read';
    sentAt: Date;
    deliveredAt?: Date;
    readAt?: Date;
    isEdited: boolean;
    editedAt?: Date;
    isDeleted: boolean;
    deletedAt?: Date;
    parentMessageId?: bigint;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAtSoft?: Date;
}
export default DirectMessage;
//# sourceMappingURL=MSG-DirectMessage-IMPROVED.model.d.ts.map