import { Model, Optional, Sequelize } from 'sequelize';
interface ProjectAttributes {
    id: bigint;
    uuid: string;
    projectCode: string;
    name: string;
    description?: string;
    departmentId: bigint;
    clientId?: bigint;
    projectManagerId: bigint;
    startDate: Date;
    endDate?: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    budget?: number;
    status: 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled' | 'Archived';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    progress?: number;
    documentationUrl?: string;
    deletedAt?: Date;
}
interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'uuid'> {
}
export declare class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
    id: bigint;
    uuid: string;
    projectCode: string;
    name: string;
    description?: string;
    departmentId: bigint;
    clientId?: bigint;
    projectManagerId: bigint;
    startDate: Date;
    endDate?: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    budget?: number;
    status: 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled' | 'Archived';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    progress?: number;
    documentationUrl?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Project;
    isDelayed(): boolean;
    getDaysRemaining(): number | null;
}
export {};
//# sourceMappingURL=Project.model.d.ts.map