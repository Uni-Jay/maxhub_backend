import { Model } from 'sequelize';
export interface ISubmittedAssignment {
    id: bigint;
    organizationId: bigint;
    assignmentId: bigint;
    studentId: bigint;
    submissionDate: Date;
    submissionUrl?: string;
    submissionText?: string;
    attachmentUrl?: string;
    status: 'Submitted' | 'Graded' | 'Returned' | 'Late';
    isLate: boolean;
    pointsEarned?: number;
    feedback?: string;
    gradedBy?: bigint;
    gradedDate?: Date;
    attempt: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class SubmittedAssignment extends Model<ISubmittedAssignment> implements ISubmittedAssignment {
    id: bigint;
    organizationId: bigint;
    assignmentId: bigint;
    studentId: bigint;
    submissionDate: Date;
    submissionUrl?: string;
    submissionText?: string;
    attachmentUrl?: string;
    status: 'Submitted' | 'Graded' | 'Returned' | 'Late';
    isLate: boolean;
    pointsEarned?: number;
    feedback?: string;
    gradedBy?: bigint;
    gradedDate?: Date;
    attempt: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default SubmittedAssignment;
//# sourceMappingURL=LMS-SubmittedAssignment.model.d.ts.map