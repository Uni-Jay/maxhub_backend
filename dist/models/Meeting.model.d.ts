import { Model, Optional, Sequelize } from 'sequelize';
interface MeetingAttributes {
    id: bigint;
    uuid: string;
    meetingCode: string;
    title: string;
    description?: string;
    meetingType: 'OneToOne' | 'Group' | 'Department' | 'Classroom' | 'Interview' | 'Training';
    roomName: string;
    hostUserId: bigint;
    scheduledAt?: Date;
    durationMinutes?: number;
    status: 'Scheduled' | 'Live' | 'Ended' | 'Cancelled';
    maxParticipants?: number;
    isRecurring?: boolean;
    recordingUrl?: string;
    cloudinaryPublicId?: string;
    deletedAt?: Date;
}
interface MeetingCreationAttributes extends Optional<MeetingAttributes, 'id' | 'uuid'> {
}
export declare class Meeting extends Model<MeetingAttributes, MeetingCreationAttributes> implements MeetingAttributes {
    id: bigint;
    uuid: string;
    meetingCode: string;
    title: string;
    description?: string;
    meetingType: 'OneToOne' | 'Group' | 'Department' | 'Classroom' | 'Interview' | 'Training';
    roomName: string;
    hostUserId: bigint;
    scheduledAt?: Date;
    durationMinutes?: number;
    status: 'Scheduled' | 'Live' | 'Ended' | 'Cancelled';
    maxParticipants?: number;
    isRecurring?: boolean;
    recordingUrl?: string;
    cloudinaryPublicId?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Meeting;
}
export {};
//# sourceMappingURL=Meeting.model.d.ts.map