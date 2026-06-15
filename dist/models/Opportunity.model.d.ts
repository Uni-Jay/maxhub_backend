import { Model, Optional, Sequelize } from 'sequelize';
interface OpportunityAttributes {
    id: bigint;
    uuid: string;
    opportunityCode: string;
    title: string;
    description?: string;
    accountId?: bigint;
    primaryContactId: bigint;
    ownerUserId: bigint;
    amount: number;
    currency: string;
    closeDate: Date;
    stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | 'Closed';
    probability?: number;
    expectedRevenue?: number;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    type: 'New Business' | 'Expansion' | 'Renewal' | 'Upgrade' | 'Cross-sell' | 'Up-sell';
    source?: string;
    competitorInfo?: string;
    nextStepDate?: Date;
    nextStep?: string;
    lostReason?: string;
    lostDate?: Date;
    wonDate?: Date;
    deletedAt?: Date;
}
interface OpportunityCreationAttributes extends Optional<OpportunityAttributes, 'id' | 'uuid'> {
}
export declare class Opportunity extends Model<OpportunityAttributes, OpportunityCreationAttributes> implements OpportunityAttributes {
    id: bigint;
    uuid: string;
    opportunityCode: string;
    title: string;
    description?: string;
    accountId?: bigint;
    primaryContactId: bigint;
    ownerUserId: bigint;
    amount: number;
    currency: string;
    closeDate: Date;
    stage: 'Prospecting' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost' | 'Closed';
    probability?: number;
    expectedRevenue?: number;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    type: 'New Business' | 'Expansion' | 'Renewal' | 'Upgrade' | 'Cross-sell' | 'Up-sell';
    source?: string;
    competitorInfo?: string;
    nextStepDate?: Date;
    nextStep?: string;
    lostReason?: string;
    lostDate?: Date;
    wonDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Opportunity;
    isOverdue(): boolean;
    calculateExpectedValue(): number;
    daysUntilClose(): number;
    isNextStepOverdue(): boolean;
}
export {};
//# sourceMappingURL=Opportunity.model.d.ts.map