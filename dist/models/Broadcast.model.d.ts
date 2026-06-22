import { Model, Optional, Sequelize } from 'sequelize';
interface BroadcastAttributes {
    id: bigint;
    uuid: string;
    title: string;
    message: string;
    audienceType: 'All' | 'BusinessUnit' | 'Department' | 'Role';
    audienceValue?: string;
    createdById: bigint;
    deletedAt?: Date;
}
interface BroadcastCreationAttributes extends Optional<BroadcastAttributes, 'id' | 'uuid'> {
}
export declare class Broadcast extends Model<BroadcastAttributes, BroadcastCreationAttributes> implements BroadcastAttributes {
    id: bigint;
    uuid: string;
    title: string;
    message: string;
    audienceType: 'All' | 'BusinessUnit' | 'Department';
    audienceValue?: string;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Broadcast;
}
export default Broadcast;
//# sourceMappingURL=Broadcast.model.d.ts.map