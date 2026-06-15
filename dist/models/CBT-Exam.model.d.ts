import { Model } from 'sequelize';
export interface IExam {
    id: bigint;
    organizationId: bigint;
    examCode: string;
    examTitle: string;
    description?: string;
    examType: 'Quiz' | 'Midterm' | 'FinalExam' | 'Assessment' | 'PreTest' | 'PostTest';
    totalQuestions: number;
    totalPoints: number;
    passingScore: number;
    duration: number;
    shuffleQuestions: boolean;
    randomizeOptions: boolean;
    showCorrectAnswers: boolean;
    allowReview: boolean;
    maxAttempts?: number;
    courseId?: bigint;
    status: 'Draft' | 'Published' | 'Active' | 'Closed' | 'Archived';
    startDateTime?: Date;
    endDateTime?: Date;
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Exam extends Model<IExam> implements IExam {
    id: bigint;
    organizationId: bigint;
    examCode: string;
    examTitle: string;
    description?: string;
    examType: 'Quiz' | 'Midterm' | 'FinalExam' | 'Assessment' | 'PreTest' | 'PostTest';
    totalQuestions: number;
    totalPoints: number;
    passingScore: number;
    duration: number;
    shuffleQuestions: boolean;
    randomizeOptions: boolean;
    showCorrectAnswers: boolean;
    allowReview: boolean;
    maxAttempts?: number;
    courseId?: bigint;
    status: 'Draft' | 'Published' | 'Active' | 'Closed' | 'Archived';
    startDateTime?: Date;
    endDateTime?: Date;
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Exam;
//# sourceMappingURL=CBT-Exam.model.d.ts.map