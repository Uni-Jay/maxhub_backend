import { Model } from 'sequelize';
export interface IExamResult {
    id: bigint;
    organizationId: bigint;
    examAttemptId: bigint;
    examId: bigint;
    studentId: bigint;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
    status: 'Pass' | 'Fail';
    resultDate: Date;
    resultFinalizedAt: Date;
    viewedAt?: Date;
    certificateEligible: boolean;
    resultDetails?: string;
    adminNotes?: string;
    createdBy: bigint;
    createdAt: Date;
}
export declare class ExamResult extends Model<IExamResult> implements IExamResult {
    id: bigint;
    organizationId: bigint;
    examAttemptId: bigint;
    examId: bigint;
    studentId: bigint;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
    status: 'Pass' | 'Fail';
    resultDate: Date;
    resultFinalizedAt: Date;
    viewedAt?: Date;
    certificateEligible: boolean;
    resultDetails?: string;
    adminNotes?: string;
    createdBy: bigint;
    createdAt: Date;
}
export default ExamResult;
//# sourceMappingURL=CBT-ExamResult-IMPROVED.model.d.ts.map