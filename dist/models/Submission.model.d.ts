import { Model, Optional, Sequelize } from 'sequelize';
interface SubmissionAttributes {
    id: bigint;
    uuid: string;
    assignmentId: bigint;
    enrollmentId: bigint;
    submissionText?: string;
    submissionUrl?: string;
    submissionFile?: string;
    submittedAt: Date;
    isLate: boolean;
    scoredPoints?: number;
    feedback?: string;
    reviewedBy?: bigint;
    reviewedAt?: Date;
    status: 'Draft' | 'Submitted' | 'Reviewed' | 'Returned' | 'Late';
    deletedAt?: Date;
}
interface SubmissionCreationAttributes extends Optional<SubmissionAttributes, 'id' | 'uuid'> {
}
export declare class Submission extends Model<SubmissionAttributes, SubmissionCreationAttributes> implements SubmissionAttributes {
    id: bigint;
    uuid: string;
    assignmentId: bigint;
    enrollmentId: bigint;
    submissionText?: string;
    submissionUrl?: string;
    submissionFile?: string;
    submittedAt: Date;
    isLate: boolean;
    scoredPoints?: number;
    feedback?: string;
    reviewedBy?: bigint;
    reviewedAt?: Date;
    status: 'Draft' | 'Submitted' | 'Reviewed' | 'Returned' | 'Late';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Submission;
}
export {};
//# sourceMappingURL=Submission.model.d.ts.map