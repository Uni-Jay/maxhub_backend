import { Model, Optional, Sequelize } from 'sequelize';
interface JobSyncLogAttributes {
    id: bigint;
    uuid: string;
    jobPostingId: bigint;
    businessUnit: string;
    action: 'Create' | 'Update' | 'Delete';
    status: 'Success' | 'Failed';
    httpStatusCode?: number;
    errorMessage?: string;
    attemptNumber: number;
}
interface JobSyncLogCreationAttributes extends Optional<JobSyncLogAttributes, 'id' | 'uuid'> {
}
export declare class JobSyncLog extends Model<JobSyncLogAttributes, JobSyncLogCreationAttributes> implements JobSyncLogAttributes {
    id: bigint;
    uuid: string;
    jobPostingId: bigint;
    businessUnit: string;
    action: 'Create' | 'Update' | 'Delete';
    status: 'Success' | 'Failed';
    httpStatusCode?: number;
    errorMessage?: string;
    attemptNumber: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof JobSyncLog;
}
export {};
//# sourceMappingURL=JobSyncLog.model.d.ts.map