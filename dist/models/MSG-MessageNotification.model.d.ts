import { Model } from 'sequelize';
export interface IMessageNotification {
    id: bigint;
    organizationId: bigint;
    userId: bigint;
    notificationType: 'NewDirectMessage' | 'NewChatMessage' | 'Mention' | 'FileShared' | 'VoiceNote';
    notificationTitle: string;
    notificationBody?: string;
    sourceMessageId: bigint;
    sourceDirectMessageId?: bigint;
    sourceChatMessageId?: bigint;
    sourceUserId?: bigint;
    isRead: boolean;
    readAt?: Date;
    notificationAction?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class MessageNotification extends Model<IMessageNotification> implements IMessageNotification {
    id: bigint;
    organizationId: bigint;
    userId: bigint;
    notificationType: 'NewDirectMessage' | 'NewChatMessage' | 'Mention' | 'FileShared' | 'VoiceNote';
    notificationTitle: string;
    notificationBody?: string;
    sourceMessageId: bigint;
    sourceDirectMessageId?: bigint;
    sourceChatMessageId?: bigint;
    sourceUserId?: bigint;
    isRead: boolean;
    readAt?: Date;
    notificationAction?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default MessageNotification;
//# sourceMappingURL=MSG-MessageNotification.model.d.ts.map