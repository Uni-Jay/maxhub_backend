import { Model, Optional, Sequelize } from 'sequelize';
interface MessageAttributes {
    id: bigint;
    uuid: string;
    conversationId: bigint;
    senderUserId: bigint;
    messageText: string;
    messageType: 'Text' | 'Image' | 'File' | 'Link' | 'Emoji' | 'Mention';
    attachmentUrl?: string;
    attachmentType?: string;
    replyToMessageId?: bigint;
    isEdited: boolean;
    editedAt?: Date;
    isPinned: boolean;
    reactions?: string;
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
    messageType: 'Text' | 'Image' | 'File' | 'Link' | 'Emoji' | 'Mention';
    attachmentUrl?: string;
    attachmentType?: string;
    replyToMessageId?: bigint;
    isEdited: boolean;
    editedAt?: Date;
    isPinned: boolean;
    reactions?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Message;
}
export {};
//# sourceMappingURL=Message.model.d.ts.map