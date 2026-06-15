import { Model, Optional, Sequelize } from 'sequelize';
interface TaskAssignmentAttributes {
    id: bigint;
    uuid: string;
    taskId: bigint;
    projectId: bigint;
    assignedToStaffId: bigint;
    assignedByStaffId: bigint;
    assignedDate: Date;
    estimatedHours?: number;
    actualHours?: number;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    assignmentStatus: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
    acceptedDate?: Date;
    declinedDate?: Date;
    declinedReason?: string;
    completedDate?: Date;
    remarks?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface TaskAssignmentCreationAttributes extends Optional<TaskAssignmentAttributes, 'id' | 'uuid'> {
}
export declare class TaskAssignment extends Model<TaskAssignmentAttributes, TaskAssignmentCreationAttributes> implements TaskAssignmentAttributes {
    id: bigint;
    uuid: string;
    taskId: bigint;
    projectId: bigint;
    assignedToStaffId: bigint;
    assignedByStaffId: bigint;
    assignedDate: Date;
    estimatedHours?: number;
    actualHours?: number;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    assignmentStatus: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
    acceptedDate?: Date;
    declinedDate?: Date;
    declinedReason?: string;
    completedDate?: Date;
    remarks?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof TaskAssignment;
}
export {};
//# sourceMappingURL=TaskAssignment.model.d.ts.map