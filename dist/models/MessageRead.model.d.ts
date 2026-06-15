import { Model, Optional, Sequelize } from 'sequelize';
interface MessageReadAttributes {
    id: bigint;
    uuid: string;
    messageId: bigint;
    userId: bigint;
    readAt: Date;
    deletedAt?: Date;
}
interface MessageReadCreationAttributes extends Optional<MessageReadAttributes, 'id' | 'uuid'> {
}
export declare class MessageRead extends Model<MessageReadAttributes, MessageReadCreationAttributes> implements MessageReadAttributes {
    id: bigint;
    uuid: string;
    messageId: bigint;
    userId: bigint;
    readAt: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof MessageRead;
}
export {};
//# sourceMappingURL=MessageRead.model.d.ts.map