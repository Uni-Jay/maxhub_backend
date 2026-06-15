import { Model } from 'sequelize';
export interface IChatMessage {
    id: bigint;
    organizationId: bigint;
    departmentChatId: bigint;
    senderId: bigint;
    messageText: string;
    messageType: 'Text' | 'File' | 'Image' | 'Video' | 'VoiceNote';
    status: 'Sent' | 'Delivered' | 'Read';
    sentAt: Date;
    isEdited: boolean;
    editedAt?: Date;
    editedBy?: bigint;
    readByCount: number;
    mentionedUsers?: string;
    parentMessageId?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class ChatMessage extends Model<IChatMessage> implements IChatMessage {
    id: bigint;
    organizationId: bigint;
    departmentChatId: bigint;
    senderId: bigint;
    messageText: string;
    messageType: 'Text' | 'File' | 'Image' | 'Video' | 'VoiceNote';
    status: 'Sent' | 'Delivered' | 'Read';
    sentAt: Date;
    isEdited: boolean;
    editedAt?: Date;
    editedBy?: bigint;
    readByCount: number;
    mentionedUsers?: string;
    parentMessageId?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default ChatMessage;
//# sourceMappingURL=MSG-ChatMessage.model.d.ts.map