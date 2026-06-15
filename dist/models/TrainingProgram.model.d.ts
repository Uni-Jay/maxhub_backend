import { Model, Optional, Sequelize } from 'sequelize';
interface TrainingProgramAttributes {
    id: bigint;
    uuid: string;
    trainingCode: string;
    trainingName: string;
    description?: string;
    trainingType: 'Mandatory' | 'Optional' | 'InductionProgram' | 'SkillDevelopment' | 'Leadership';
    duration: number;
    durationUnit: 'Days' | 'Weeks' | 'Months' | 'Hours';
    provider?: string;
    location?: string;
    status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
    startDate: Date;
    endDate: Date;
    budget?: number;
    createdById: bigint;
    deletedAt?: Date;
}
interface TrainingProgramCreationAttributes extends Optional<TrainingProgramAttributes, 'id' | 'uuid'> {
}
export declare class TrainingProgram extends Model<TrainingProgramAttributes, TrainingProgramCreationAttributes> implements TrainingProgramAttributes {
    id: bigint;
    uuid: string;
    trainingCode: string;
    trainingName: string;
    description?: string;
    trainingType: 'Mandatory' | 'Optional' | 'InductionProgram' | 'SkillDevelopment' | 'Leadership';
    duration: number;
    durationUnit: 'Days' | 'Weeks' | 'Months' | 'Hours';
    provider?: string;
    location?: string;
    status: 'Draft' | 'Active' | 'Completed' | 'Cancelled';
    startDate: Date;
    endDate: Date;
    budget?: number;
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof TrainingProgram;
}
export {};
//# sourceMappingURL=TrainingProgram.model.d.ts.map