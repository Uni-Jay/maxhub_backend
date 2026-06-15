import { Model } from 'sequelize';
export interface IQuestionOption {
    id: bigint;
    organizationId: bigint;
    questionId: bigint;
    optionLetter: string;
    optionText: string;
    isCorrect: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class QuestionOption extends Model<IQuestionOption> implements IQuestionOption {
    id: bigint;
    organizationId: bigint;
    questionId: bigint;
    optionLetter: string;
    optionText: string;
    isCorrect: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default QuestionOption;
//# sourceMappingURL=CBT-QuestionOption.model.d.ts.map