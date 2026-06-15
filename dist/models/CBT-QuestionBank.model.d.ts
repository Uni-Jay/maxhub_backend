import { Model } from 'sequelize';
export interface IQuestionBank {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    bankCode: string;
    bankName: string;
    description?: string;
    category: string;
    totalQuestions: number;
    difficulty: 'Mixed' | 'Easy' | 'Intermediate' | 'Advanced';
    createdBy: bigint;
    updatedBy?: bigint;
    isPublic: boolean;
    status: 'Active' | 'Inactive' | 'Archived';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class QuestionBank extends Model<IQuestionBank> implements IQuestionBank {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    bankCode: string;
    bankName: string;
    description?: string;
    category: string;
    totalQuestions: number;
    difficulty: 'Mixed' | 'Easy' | 'Intermediate' | 'Advanced';
    createdBy: bigint;
    updatedBy?: bigint;
    isPublic: boolean;
    status: 'Active' | 'Inactive' | 'Archived';
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default QuestionBank;
//# sourceMappingURL=CBT-QuestionBank.model.d.ts.map