import { Model } from 'sequelize';
export interface IQuestion {
    id: bigint;
    organizationId: bigint;
    questionBankId?: bigint;
    questionText: string;
    questionType: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    points: number;
    correctAnswer?: string;
    explanation?: string;
    imageUrl?: string;
    timeLimit?: number;
    status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Question extends Model<IQuestion> implements IQuestion {
    id: bigint;
    organizationId: bigint;
    questionBankId?: bigint;
    questionText: string;
    questionType: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    points: number;
    correctAnswer?: string;
    explanation?: string;
    imageUrl?: string;
    timeLimit?: number;
    status: 'Draft' | 'Active' | 'Inactive' | 'Archived';
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Question;
//# sourceMappingURL=CBT-Question.model.d.ts.map