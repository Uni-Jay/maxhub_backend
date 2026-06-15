import { Model, Optional, Sequelize } from 'sequelize';
interface FeedbackAttributes {
    id: bigint;
    uuid: string;
    feedbackCode: string;
    employeeId: bigint;
    givenBy: bigint;
    feedbackType: 'Positive' | 'Constructive' | 'Neutral';
    category: string;
    subject?: string;
    comment: string;
    isAnonymous: boolean;
    isPublic: boolean;
    acknowledgement?: string;
    acknowledgedDate?: Date;
    rating?: number;
    deletedAt?: Date;
}
interface FeedbackCreationAttributes extends Optional<FeedbackAttributes, 'id' | 'uuid'> {
}
export declare class Feedback extends Model<FeedbackAttributes, FeedbackCreationAttributes> implements FeedbackAttributes {
    id: bigint;
    uuid: string;
    feedbackCode: string;
    employeeId: bigint;
    givenBy: bigint;
    feedbackType: 'Positive' | 'Constructive' | 'Neutral';
    category: string;
    subject?: string;
    comment: string;
    isAnonymous: boolean;
    isPublic: boolean;
    acknowledgement?: string;
    acknowledgedDate?: Date;
    rating?: number;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Feedback;
}
export {};
//# sourceMappingURL=Feedback.model.d.ts.map