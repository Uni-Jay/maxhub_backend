import { Model } from 'sequelize';
export interface IExamAnswer {
    id: bigint;
    organizationId: bigint;
    examAttemptId: bigint;
    questionId: bigint;
    questionText: string;
    marksAllocated: number;
    studentAnswer?: string;
    isCorrect: boolean;
    marksObtained: number;
    autoGraded: boolean;
    manualGradedBy?: bigint;
    manualGradedAt?: Date;
    manualFeedback?: string;
    sequence: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class ExamAnswer extends Model<IExamAnswer> implements IExamAnswer {
    id: bigint;
    organizationId: bigint;
    examAttemptId: bigint;
    questionId: bigint;
    questionText: string;
    marksAllocated: number;
    studentAnswer?: string;
    isCorrect: boolean;
    marksObtained: number;
    autoGraded: boolean;
    manualGradedBy?: bigint;
    manualGradedAt?: Date;
    manualFeedback?: string;
    sequence: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default ExamAnswer;
//# sourceMappingURL=CBT-ExamAnswer.model.d.ts.map