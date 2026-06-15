import { Model, Optional, Sequelize } from 'sequelize';
interface ConversationAttributes {
    id: bigint;
    uuid: string;
    conversationCode: string;
    title: string;
    conversationType: 'Direct' | 'Group' | 'Team' | 'Channel';
    createdById: bigint;
    isArchived: boolean;
    lastMessageAt?: Date;
    deletedAt?: Date;
}
interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'uuid'> {
}
export declare class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
    id: bigint;
    uuid: string;
    conversationCode: string;
    title: string;
    conversationType: 'Direct' | 'Group' | 'Team' | 'Channel';
    createdById: bigint;
    isArchived: boolean;
    lastMessageAt?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Conversation;
}
export {};
//# sourceMappingURL=Conversation.model.d.ts.map