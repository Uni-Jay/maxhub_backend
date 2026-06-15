import { Model, Optional, Sequelize } from 'sequelize';
interface ConversationParticipantAttributes {
    id: bigint;
    uuid: string;
    conversationId: bigint;
    userId: bigint;
    role: 'Admin' | 'Member' | 'Moderator' | 'Viewer';
    joinedAt: Date;
    lastSeenAt?: Date;
    isMuted: boolean;
    deletedAt?: Date;
}
interface ConversationParticipantCreationAttributes extends Optional<ConversationParticipantAttributes, 'id' | 'uuid'> {
}
export declare class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
    id: bigint;
    uuid: string;
    conversationId: bigint;
    userId: bigint;
    role: 'Admin' | 'Member' | 'Moderator' | 'Viewer';
    joinedAt: Date;
    lastSeenAt?: Date;
    isMuted: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof ConversationParticipant;
}
export {};
//# sourceMappingURL=ConversationParticipant.model.d.ts.map