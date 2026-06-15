import { Model } from 'sequelize';
export interface IStudentExamAttempt {
    id: bigint;
    organizationId: bigint;
    examId: bigint;
    studentId: bigint;
    attemptNumber: number;
    startTime: Date;
    endTime?: Date;
    timeSpent?: number;
    status: 'InProgress' | 'Submitted' | 'Graded' | 'Abandoned';
    isSubmitted: boolean;
    submittedAt?: Date;
    totalQuestions: number;
    questionsAnswered: number;
    questionsSkipped: number;
    marksObtained?: number;
    totalMarks: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class StudentExamAttempt extends Model<IStudentExamAttempt> implements IStudentExamAttempt {
    id: bigint;
    organizationId: bigint;
    examId: bigint;
    studentId: bigint;
    attemptNumber: number;
    startTime: Date;
    endTime?: Date;
    timeSpent?: number;
    status: 'InProgress' | 'Submitted' | 'Graded' | 'Abandoned';
    isSubmitted: boolean;
    submittedAt?: Date;
    totalQuestions: number;
    questionsAnswered: number;
    questionsSkipped: number;
    marksObtained?: number;
    totalMarks: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default StudentExamAttempt;
//# sourceMappingURL=CBT-StudentExamAttempt.model.d.ts.map