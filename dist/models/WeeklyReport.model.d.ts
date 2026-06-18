import { Model, Optional, Sequelize } from 'sequelize';
interface TaskStatusCounts {
    assigned: number;
    inProgress: number;
    completed: number;
    delayed: number;
    blocked: number;
}
interface AttachmentRef {
    url: string;
    publicId: string;
    name?: string;
}
interface WeeklyReportAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    weekEnding: string;
    accomplishments: string;
    challenges: string;
    nextWeekPlans: string;
    hoursWorked?: number;
    hasBlocker: boolean;
    blockerNotes?: string;
    taskStatus?: TaskStatusCounts;
    attachments?: AttachmentRef[];
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    approvedById?: bigint;
    approvedDate?: Date;
    rejectionReason?: string;
    deletedAt?: Date;
}
interface WeeklyReportCreationAttributes extends Optional<WeeklyReportAttributes, 'id' | 'uuid' | 'hasBlocker' | 'approvalStatus'> {
}
export declare class WeeklyReport extends Model<WeeklyReportAttributes, WeeklyReportCreationAttributes> implements WeeklyReportAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    weekEnding: string;
    accomplishments: string;
    challenges: string;
    nextWeekPlans: string;
    hoursWorked?: number;
    hasBlocker: boolean;
    blockerNotes?: string;
    taskStatus?: TaskStatusCounts;
    attachments?: AttachmentRef[];
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    approvedById?: bigint;
    approvedDate?: Date;
    rejectionReason?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof WeeklyReport;
}
export {};
//# sourceMappingURL=WeeklyReport.model.d.ts.map