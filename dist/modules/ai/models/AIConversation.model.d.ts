import { Model, Optional, Sequelize } from 'sequelize';
interface AIConversationAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    title: string;
    model: string;
    feature: 'chat' | 'report' | 'summarize' | 'email' | 'tasks' | 'reminder';
    messageCount: number;
    deletedAt?: Date;
}
interface AIConversationCreationAttributes extends Optional<AIConversationAttributes, 'id' | 'uuid' | 'messageCount'> {
}
export declare class AIConversation extends Model<AIConversationAttributes, AIConversationCreationAttributes> implements AIConversationAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    title: string;
    model: string;
    feature: 'chat' | 'report' | 'summarize' | 'email' | 'tasks' | 'reminder';
    messageCount: number;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AIConversation;
}
export {};
//# sourceMappingURL=AIConversation.model.d.ts.map