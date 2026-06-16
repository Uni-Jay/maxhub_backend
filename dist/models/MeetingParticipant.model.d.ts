import { Model, Optional, Sequelize } from 'sequelize';
interface MeetingParticipantAttributes {
    id: bigint;
    meetingId: bigint;
    userId: bigint;
    joinedAt?: Date;
    leftAt?: Date;
    durationSeconds?: number;
    status: 'Invited' | 'Joined' | 'Declined' | 'NoShow';
}
interface MeetingParticipantCreationAttributes extends Optional<MeetingParticipantAttributes, 'id'> {
}
export declare class MeetingParticipant extends Model<MeetingParticipantAttributes, MeetingParticipantCreationAttributes> implements MeetingParticipantAttributes {
    id: bigint;
    meetingId: bigint;
    userId: bigint;
    joinedAt?: Date;
    leftAt?: Date;
    durationSeconds?: number;
    status: 'Invited' | 'Joined' | 'Declined' | 'NoShow';
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof MeetingParticipant;
}
export {};
//# sourceMappingURL=MeetingParticipant.model.d.ts.map