import { Model, Optional, Sequelize } from 'sequelize';
interface OnboardingTaskAttributes {
    id: bigint;
    uuid: string;
    jobOfferId: bigint;
    staffId?: bigint;
    taskName: string;
    description?: string;
    taskType: 'Document' | 'Training' | 'Equipment' | 'System' | 'Orientation' | 'Other';
    dueDate?: Date;
    assignedTo?: bigint;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Skipped';
    completedDate?: Date;
    notes?: string;
    deletedAt?: Date;
}
interface OnboardingTaskCreationAttributes extends Optional<OnboardingTaskAttributes, 'id' | 'uuid'> {
}
export declare class OnboardingTask extends Model<OnboardingTaskAttributes, OnboardingTaskCreationAttributes> implements OnboardingTaskAttributes {
    id: bigint;
    uuid: string;
    jobOfferId: bigint;
    staffId?: bigint;
    taskName: string;
    description?: string;
    taskType: 'Document' | 'Training' | 'Equipment' | 'System' | 'Orientation' | 'Other';
    dueDate?: Date;
    assignedTo?: bigint;
    status: 'Pending' | 'InProgress' | 'Completed' | 'Skipped';
    completedDate?: Date;
    notes?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof OnboardingTask;
}
export {};
//# sourceMappingURL=OnboardingTask.model.d.ts.map