import { Model, Optional, Sequelize } from 'sequelize';
interface ExamAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    examCode: string;
    examName: string;
    description?: string;
    totalQuestions: number;
    passingScore: number;
    duration: number;
    attempts: number;
    status: 'Draft' | 'Published' | 'Archived' | 'Disabled';
    createdById: bigint;
    deletedAt?: Date;
}
interface ExamCreationAttributes extends Optional<ExamAttributes, 'id' | 'uuid'> {
}
export declare class Exam extends Model<ExamAttributes, ExamCreationAttributes> implements ExamAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    examCode: string;
    examName: string;
    description?: string;
    totalQuestions: number;
    passingScore: number;
    duration: number;
    attempts: number;
    status: 'Draft' | 'Published' | 'Archived' | 'Disabled';
    createdById: bigint;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Exam;
}
export {};
//# sourceMappingURL=Exam.model.d.ts.map