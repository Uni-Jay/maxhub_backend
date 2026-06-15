import { Model } from 'sequelize';
export interface IChatParticipant {
    id: bigint;
    organizationId: bigint;
    departmentChatId: bigint;
    staffId: bigint;
    role: 'Admin' | 'Moderator' | 'Member';
    joinedAt: Date;
    leftAt?: Date;
    isMuted: boolean;
    muteNotifications: boolean;
    lastReadAt?: Date;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class ChatParticipant extends Model<IChatParticipant> implements IChatParticipant {
    id: bigint;
    organizationId: bigint;
    departmentChatId: bigint;
    staffId: bigint;
    role: 'Admin' | 'Moderator' | 'Member';
    joinedAt: Date;
    leftAt?: Date;
    isMuted: boolean;
    muteNotifications: boolean;
    lastReadAt?: Date;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default ChatParticipant;
//# sourceMappingURL=MSG-ChatParticipant.model.d.ts.map