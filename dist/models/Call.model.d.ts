import { Model, Optional, Sequelize } from 'sequelize';
interface CallAttributes {
    id: bigint;
    uuid: string;
    callerUserId: bigint;
    calleeUserId: bigint;
    callType: 'Video' | 'Voice';
    status: 'Ringing' | 'Active' | 'Ended' | 'Missed' | 'Declined';
    roomName: string;
    conversationId?: bigint;
    startedAt?: Date;
    endedAt?: Date;
    durationSeconds?: number;
}
interface CallCreationAttributes extends Optional<CallAttributes, 'id' | 'uuid'> {
}
export declare class Call extends Model<CallAttributes, CallCreationAttributes> implements CallAttributes {
    id: bigint;
    uuid: string;
    callerUserId: bigint;
    calleeUserId: bigint;
    callType: 'Video' | 'Voice';
    status: 'Ringing' | 'Active' | 'Ended' | 'Missed' | 'Declined';
    roomName: string;
    conversationId?: bigint;
    startedAt?: Date;
    endedAt?: Date;
    durationSeconds?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Call;
}
export {};
//# sourceMappingURL=Call.model.d.ts.map