import { Model, Optional, Sequelize } from 'sequelize';
interface GoalAttributes {
    id: bigint;
    uuid: string;
    goalCode: string;
    staffId: bigint;
    goalTitle: string;
    description?: string;
    objectiveCategory: string;
    targetValue?: number;
    actualValue?: number;
    progress: number;
    status: 'NotStarted' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled';
    startDate: Date;
    targetDate: Date;
    completedDate?: Date;
    comments?: string;
    createdById: bigint;
    deletedAt?: Date;
}
interface GoalCreationAttributes extends Optional<GoalAttributes, 'id' | 'uuid'> {
}
export declare class Goal extends Model<GoalAttributes, GoalCreationAttributes> implements GoalAttributes {
    id: bigint;
    uuid: string;
    goalCode: string;
    staffId: bigint;
    goalTitle: string;
    description?: string;
    objectiveCategory: string;
    targetValue?: number;
    actualValue?: number;
    progress: number;
    status: 'NotStarted' | 'InProgress' | 'Completed' | 'OnHold' | 'Cancelled';
    startDate: Date;
    targetDate: Date;
    completedDate?: Date;
    comments?: string;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Goal;
}
export {};
//# sourceMappingURL=Goal.model.d.ts.map