import { Model, Optional, Sequelize } from 'sequelize';
interface AIMeetingSummaryAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    title: string;
    transcript: string;
    summary: string;
    actionItems: object[];
    keyDecisions: string[];
    nextSteps: string[];
    model: string;
    participants?: string[];
    deletedAt?: Date;
}
interface AIMeetingSummaryCreationAttributes extends Optional<AIMeetingSummaryAttributes, 'id' | 'uuid' | 'participants'> {
}
export declare class AIMeetingSummary extends Model<AIMeetingSummaryAttributes, AIMeetingSummaryCreationAttributes> implements AIMeetingSummaryAttributes {
    id: bigint;
    uuid: string;
    userId: bigint;
    title: string;
    transcript: string;
    summary: string;
    actionItems: object[];
    keyDecisions: string[];
    nextSteps: string[];
    model: string;
    participants?: string[];
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AIMeetingSummary;
}
export {};
//# sourceMappingURL=AIMeetingSummary.model.d.ts.map