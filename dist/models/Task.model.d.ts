import { Model, Optional, Sequelize } from 'sequelize';
interface TaskAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    taskCode: string;
    title: string;
    description?: string;
    assigneeId?: bigint;
    reporterId: bigint;
    parentTaskId?: bigint;
    milestoneId?: bigint;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Todo' | 'InProgress' | 'InReview' | 'Blocked' | 'Done' | 'Cancelled';
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    progress?: number;
    label?: string;
    deletedAt?: Date;
}
interface TaskCreationAttributes extends Optional<TaskAttributes, 'id' | 'uuid'> {
}
export declare class Task extends Model<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    taskCode: string;
    title: string;
    description?: string;
    assigneeId?: bigint;
    reporterId: bigint;
    parentTaskId?: bigint;
    milestoneId?: bigint;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    status: 'Todo' | 'InProgress' | 'InReview' | 'Blocked' | 'Done' | 'Cancelled';
    startDate?: Date;
    dueDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    progress?: number;
    label?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Task;
    isOverdue(): boolean;
    isBlocked(): boolean;
    getBurndownPercent(): number;
    getEfficiency(): number | null;
}
export {};
//# sourceMappingURL=Task.model.d.ts.map