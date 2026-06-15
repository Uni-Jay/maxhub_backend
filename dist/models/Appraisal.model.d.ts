import { Model, Optional, Sequelize } from 'sequelize';
interface AppraisalAttributes {
    id: bigint;
    uuid: string;
    appraisalCode: string;
    staffId: bigint;
    appraisalPeriod: string;
    appraisalDate: Date;
    reviewerUserId: bigint;
    overallRating: number;
    performanceNotes?: string;
    strengths?: string;
    improvements?: string;
    status: 'Draft' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
    completedDate?: Date;
    approvedBy?: bigint;
    approvedDate?: Date;
    deletedAt?: Date;
}
interface AppraisalCreationAttributes extends Optional<AppraisalAttributes, 'id' | 'uuid'> {
}
export declare class Appraisal extends Model<AppraisalAttributes, AppraisalCreationAttributes> implements AppraisalAttributes {
    id: bigint;
    uuid: string;
    appraisalCode: string;
    staffId: bigint;
    appraisalPeriod: string;
    appraisalDate: Date;
    reviewerUserId: bigint;
    overallRating: number;
    performanceNotes?: string;
    strengths?: string;
    improvements?: string;
    status: 'Draft' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
    completedDate?: Date;
    approvedBy?: bigint;
    approvedDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Appraisal;
}
export {};
//# sourceMappingURL=Appraisal.model.d.ts.map