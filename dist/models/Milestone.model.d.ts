import { Model, Optional, Sequelize } from 'sequelize';
interface MilestoneAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    title: string;
    description?: string;
    startDate?: Date;
    targetDate: Date;
    completionDate?: Date;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Delayed';
    progress?: number;
    deletedAt?: Date;
}
interface MilestoneCreationAttributes extends Optional<MilestoneAttributes, 'id' | 'uuid'> {
}
export declare class Milestone extends Model<MilestoneAttributes, MilestoneCreationAttributes> implements MilestoneAttributes {
    id: bigint;
    uuid: string;
    projectId: bigint;
    title: string;
    description?: string;
    startDate?: Date;
    targetDate: Date;
    completionDate?: Date;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Delayed';
    progress?: number;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Milestone;
    isOverdue(): boolean;
    isCompleted(): boolean;
}
export {};
//# sourceMappingURL=Milestone.model.d.ts.map