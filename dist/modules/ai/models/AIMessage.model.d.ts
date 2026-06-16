import { Model, Optional, Sequelize } from 'sequelize';
interface AIMessageAttributes {
    id: bigint;
    uuid: string;
    conversationId: bigint;
    role: 'system' | 'user' | 'assistant';
    content: string;
    tokensUsed?: number;
}
interface AIMessageCreationAttributes extends Optional<AIMessageAttributes, 'id' | 'uuid' | 'tokensUsed'> {
}
export declare class AIMessage extends Model<AIMessageAttributes, AIMessageCreationAttributes> implements AIMessageAttributes {
    id: bigint;
    uuid: string;
    conversationId: bigint;
    role: 'system' | 'user' | 'assistant';
    content: string;
    tokensUsed?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AIMessage;
}
export {};
//# sourceMappingURL=AIMessage.model.d.ts.map