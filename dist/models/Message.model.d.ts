import { Model, Optional, Sequelize } from 'sequelize';
interface MessageAttributes {
    id: bigint;
    uuid: string;
    conversationId: bigint;
    senderUserId: bigint;
    messageText: string;
    messageType: 'Text' | 'Image' | 'File' | 'Link' | 'Emoji' | 'Mention' | 'Video' | 'Voice' | 'Audio';
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
    attachmentSize?: number;
    attachmentDuration?: number;
    replyToMessageId?: bigint;
    isEdited: boolean;
    editedAt?: Date;
    isPinned: boolean;
    reactions?: string;
    starredByUserIds?: number[];
    deletedForUserIds?: number[];
    deletedAt?: Date;
}
interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'uuid'> {
}
export declare class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    id: bigint;
    uuid: string;
    conversationId: bigint;
    senderUserId: bigint;
    messageText: string;
    messageType: 'Text' | 'Image' | 'File' | 'Link' | 'Emoji' | 'Mention' | 'Video' | 'Voice' | 'Audio';
    attachmentUrl?: string;
    attachmentType?: string;
    attachmentName?: string;
    attachmentSize?: number;
    attachmentDuration?: number;
    replyToMessageId?: bigint;
    isEdited: boolean;
    editedAt?: Date;
    isPinned: boolean;
    reactions?: string;
    starredByUserIds?: number[];
    deletedForUserIds?: number[];
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Message;
}
export {};
//# sourceMappingURL=Message.model.d.ts.map