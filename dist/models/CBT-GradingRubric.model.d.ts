import { Model } from 'sequelize';
export interface IGradingRubric {
    id: bigint;
    organizationId: bigint;
    questionId: bigint;
    rubricName: string;
    totalPoints: number;
    description?: string;
    status: 'Active' | 'Inactive' | 'Archived';
    createdBy: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class GradingRubric extends Model<IGradingRubric> implements IGradingRubric {
    id: bigint;
    organizationId: bigint;
    questionId: bigint;
    rubricName: string;
    totalPoints: number;
    description?: string;
    status: 'Active' | 'Inactive' | 'Archived';
    createdBy: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default GradingRubric;
//# sourceMappingURL=CBT-GradingRubric.model.d.ts.map