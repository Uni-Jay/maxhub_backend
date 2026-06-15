import { Model } from 'sequelize';
export interface IAssignment {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    lessonId?: bigint;
    assignmentTitle: string;
    description?: string;
    instructions?: string;
    dueDate: Date;
    totalPoints: number;
    passingPoints: number;
    assignmentType: 'Quiz' | 'Exercise' | 'Project' | 'Discussion' | 'Submission';
    allowLateSubmission: boolean;
    latePenalty?: number;
    maxAttempts?: number;
    attachmentUrl?: string;
    status: 'Draft' | 'Active' | 'Closed' | 'Archived';
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Assignment extends Model<IAssignment> implements IAssignment {
    id: bigint;
    organizationId: bigint;
    courseId: bigint;
    lessonId?: bigint;
    assignmentTitle: string;
    description?: string;
    instructions?: string;
    dueDate: Date;
    totalPoints: number;
    passingPoints: number;
    assignmentType: 'Quiz' | 'Exercise' | 'Project' | 'Discussion' | 'Submission';
    allowLateSubmission: boolean;
    latePenalty?: number;
    maxAttempts?: number;
    attachmentUrl?: string;
    status: 'Draft' | 'Active' | 'Closed' | 'Archived';
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Assignment;
//# sourceMappingURL=LMS-Assignment.model.d.ts.map