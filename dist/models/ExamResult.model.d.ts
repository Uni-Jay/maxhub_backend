import { Model, Optional, Sequelize } from 'sequelize';
interface ExamResultAttributes {
    id: bigint;
    uuid: string;
    examId: bigint;
    enrollmentId: bigint;
    attemptNumber: number;
    startedAt: Date;
    completedAt?: Date;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    passingScore: number;
    status: 'InProgress' | 'Passed' | 'Failed' | 'Submitted';
    answers?: string;
    notes?: string;
    deletedAt?: Date;
}
interface ExamResultCreationAttributes extends Optional<ExamResultAttributes, 'id' | 'uuid'> {
}
export declare class ExamResult extends Model<ExamResultAttributes, ExamResultCreationAttributes> implements ExamResultAttributes {
    id: bigint;
    uuid: string;
    examId: bigint;
    enrollmentId: bigint;
    attemptNumber: number;
    startedAt: Date;
    completedAt?: Date;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    passingScore: number;
    status: 'InProgress' | 'Passed' | 'Failed' | 'Submitted';
    answers?: string;
    notes?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof ExamResult;
}
export {};
//# sourceMappingURL=ExamResult.model.d.ts.map