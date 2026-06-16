import { Model, Sequelize, Optional } from 'sequelize';
export interface StaffQueryReplyAttributes {
    id: bigint;
    uuid: string;
    queryId: bigint;
    message: string;
    senderUserId: bigint;
    isInternal: boolean;
    attachments?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface StaffQueryReplyCreationAttributes extends Optional<StaffQueryReplyAttributes, 'id' | 'uuid' | 'isInternal' | 'attachments' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class StaffQueryReply extends Model<StaffQueryReplyAttributes, StaffQueryReplyCreationAttributes> implements StaffQueryReplyAttributes {
    id: bigint;
    uuid: string;
    queryId: bigint;
    message: string;
    senderUserId: bigint;
    isInternal: boolean;
    attachments?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date;
    static initModel(sequelize: Sequelize): void;
}
export default StaffQueryReply;
//# sourceMappingURL=StaffQueryReply.model.d.ts.map