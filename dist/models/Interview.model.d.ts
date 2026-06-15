import { Model, Optional, Sequelize } from 'sequelize';
interface InterviewAttributes {
    id: bigint;
    uuid: string;
    jobApplicationId: bigint;
    interviewType: 'Phone' | 'Video' | 'InPerson' | 'Group' | 'Technical' | 'HR';
    scheduledDate: Date;
    scheduledTime: string;
    interviewerUserId?: bigint;
    location?: string;
    meetingLink?: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow' | 'Rescheduled';
    rating?: number;
    feedback?: string;
    completedDate?: Date;
    notes?: string;
    deletedAt?: Date;
}
interface InterviewCreationAttributes extends Optional<InterviewAttributes, 'id' | 'uuid'> {
}
export declare class Interview extends Model<InterviewAttributes, InterviewCreationAttributes> implements InterviewAttributes {
    id: bigint;
    uuid: string;
    jobApplicationId: bigint;
    interviewType: 'Phone' | 'Video' | 'InPerson' | 'Group' | 'Technical' | 'HR';
    scheduledDate: Date;
    scheduledTime: string;
    interviewerUserId?: bigint;
    location?: string;
    meetingLink?: string;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'NoShow' | 'Rescheduled';
    rating?: number;
    feedback?: string;
    completedDate?: Date;
    notes?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Interview;
}
export {};
//# sourceMappingURL=Interview.model.d.ts.map