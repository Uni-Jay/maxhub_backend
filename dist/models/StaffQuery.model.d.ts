import { Model, Sequelize, Optional } from 'sequelize';
export interface StaffQueryAttributes {
    id: bigint;
    uuid: string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    type: 'Query' | 'Complaint' | 'Task' | 'Issue' | 'Request';
    departmentId?: bigint;
    assignedStaffId?: bigint;
    createdByUserId: bigint;
    status: 'Pending' | 'InProgress' | 'Resolved' | 'Closed';
    dueDate?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    attachments?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface StaffQueryCreationAttributes extends Optional<StaffQueryAttributes, 'id' | 'uuid' | 'departmentId' | 'assignedStaffId' | 'dueDate' | 'resolvedAt' | 'closedAt' | 'attachments' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
export declare class StaffQuery extends Model<StaffQueryAttributes, StaffQueryCreationAttributes> implements StaffQueryAttributes {
    id: bigint;
    uuid: string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    type: 'Query' | 'Complaint' | 'Task' | 'Issue' | 'Request';
    departmentId?: bigint;
    assignedStaffId?: bigint;
    createdByUserId: bigint;
    status: 'Pending' | 'InProgress' | 'Resolved' | 'Closed';
    dueDate?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    attachments?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt: Date;
    static initModel(sequelize: Sequelize): void;
}
export default StaffQuery;
//# sourceMappingURL=StaffQuery.model.d.ts.map