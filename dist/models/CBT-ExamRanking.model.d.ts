import { Model } from 'sequelize';
export interface IExamRanking {
    id: bigint;
    organizationId: bigint;
    examId: bigint;
    studentId: bigint;
    studentName: string;
    departmentId?: bigint;
    rankPosition: number;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
    attemptDate: Date;
    passStatus: 'Pass' | 'Fail';
    updatedAt: Date;
}
export declare class ExamRanking extends Model<IExamRanking> implements IExamRanking {
    id: bigint;
    organizationId: bigint;
    examId: bigint;
    studentId: bigint;
    studentName: string;
    departmentId?: bigint;
    rankPosition: number;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
    attemptDate: Date;
    passStatus: 'Pass' | 'Fail';
    updatedAt: Date;
}
export default ExamRanking;
//# sourceMappingURL=CBT-ExamRanking.model.d.ts.map