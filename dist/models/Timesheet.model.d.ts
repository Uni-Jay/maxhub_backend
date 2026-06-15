import { Model, Optional, Sequelize } from 'sequelize';
interface TimesheetAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    projectId?: bigint;
    taskId?: bigint;
    timesheetDate: Date;
    hoursWorked: number;
    description: string;
    category: 'Development' | 'Testing' | 'Design' | 'Management' | 'Support' | 'Other';
    status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
    submittedAt?: Date;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    remarks?: string;
    deletedAt?: Date;
}
interface TimesheetCreationAttributes extends Optional<TimesheetAttributes, 'id' | 'uuid'> {
}
export declare class Timesheet extends Model<TimesheetAttributes, TimesheetCreationAttributes> implements TimesheetAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    projectId?: bigint;
    taskId?: bigint;
    timesheetDate: Date;
    hoursWorked: number;
    description: string;
    category: 'Development' | 'Testing' | 'Design' | 'Management' | 'Support' | 'Other';
    status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
    submittedAt?: Date;
    approvedBy?: bigint;
    approvalStatus: 'Pending' | 'Approved' | 'Rejected';
    remarks?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Timesheet;
}
export {};
//# sourceMappingURL=Timesheet.model.d.ts.map