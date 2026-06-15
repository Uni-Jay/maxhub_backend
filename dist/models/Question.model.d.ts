import { Model, Optional, Sequelize } from 'sequelize';
interface QuestionAttributes {
    id: bigint;
    uuid: string;
    examId: bigint;
    questionType: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching' | 'FillBlank';
    questionText: string;
    points: number;
    sequence: number;
    options?: string;
    correctAnswer: string;
    explanation?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'Draft' | 'Active' | 'Archived';
    deletedAt?: Date;
}
interface QuestionCreationAttributes extends Optional<QuestionAttributes, 'id' | 'uuid'> {
}
export declare class Question extends Model<QuestionAttributes, QuestionCreationAttributes> implements QuestionAttributes {
    id: bigint;
    uuid: string;
    examId: bigint;
    questionType: 'MultipleChoice' | 'TrueFalse' | 'ShortAnswer' | 'Essay' | 'Matching' | 'FillBlank';
    questionText: string;
    points: number;
    sequence: number;
    options?: string;
    correctAnswer: string;
    explanation?: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: 'Draft' | 'Active' | 'Archived';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Question;
}
export {};
//# sourceMappingURL=Question.model.d.ts.map