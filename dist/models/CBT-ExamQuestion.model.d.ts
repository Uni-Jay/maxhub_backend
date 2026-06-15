import { Model } from 'sequelize';
export interface IExamQuestion {
    id: bigint;
    organizationId: bigint;
    examId: bigint;
    questionId: bigint;
    sequence: number;
    marks: number;
    questionType: 'Multiple Choice' | 'True/False' | 'Short Answer' | 'Essay';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class ExamQuestion extends Model<IExamQuestion> implements IExamQuestion {
    id: bigint;
    organizationId: bigint;
    examId: bigint;
    questionId: bigint;
    sequence: number;
    marks: number;
    questionType: 'Multiple Choice' | 'True/False' | 'Short Answer' | 'Essay';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default ExamQuestion;
//# sourceMappingURL=CBT-ExamQuestion.model.d.ts.map