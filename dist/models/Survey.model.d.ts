import { Model, Optional, Sequelize } from 'sequelize';
interface SurveyAttributes {
    id: bigint;
    uuid: string;
    surveyCode: string;
    surveyTitle: string;
    description?: string;
    surveyType: 'Employee Satisfaction' | 'Customer Feedback' | 'Exit Interview' | 'Training Feedback' | 'General' | 'Other';
    status: 'Draft' | 'Active' | 'Closed' | 'Archived';
    startDate: Date;
    endDate: Date;
    createdById: bigint;
    targetAudience?: string;
    responseCount?: number;
    deletedAt?: Date;
}
interface SurveyCreationAttributes extends Optional<SurveyAttributes, 'id' | 'uuid'> {
}
export declare class Survey extends Model<SurveyAttributes, SurveyCreationAttributes> implements SurveyAttributes {
    id: bigint;
    uuid: string;
    surveyCode: string;
    surveyTitle: string;
    description?: string;
    surveyType: 'Employee Satisfaction' | 'Customer Feedback' | 'Exit Interview' | 'Training Feedback' | 'General' | 'Other';
    status: 'Draft' | 'Active' | 'Closed' | 'Archived';
    startDate: Date;
    endDate: Date;
    createdById: bigint;
    targetAudience?: string;
    responseCount?: number;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Survey;
}
export {};
//# sourceMappingURL=Survey.model.d.ts.map