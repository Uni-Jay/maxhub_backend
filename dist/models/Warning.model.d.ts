import { Model, Optional, Sequelize } from 'sequelize';
interface WarningAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    issuedBy: bigint;
    warningType: 'Verbal' | 'Written' | 'Final';
    reason: string;
    description?: string;
    issuedDate: Date;
    followUpDate?: Date;
    escalationLevel: 1 | 2 | 3;
    status: 'Active' | 'Resolved' | 'Escalated' | 'Withdrawn';
    resolutionDate?: Date;
    resolutionNotes?: string;
    acknowledgedBy?: bigint;
    acknowledgedDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}
interface WarningCreationAttributes extends Optional<WarningAttributes, 'id' | 'uuid'> {
}
export declare class Warning extends Model<WarningAttributes, WarningCreationAttributes> implements WarningAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    issuedBy: bigint;
    warningType: 'Verbal' | 'Written' | 'Final';
    reason: string;
    description?: string;
    issuedDate: Date;
    followUpDate?: Date;
    escalationLevel: 1 | 2 | 3;
    status: 'Active' | 'Resolved' | 'Escalated' | 'Withdrawn';
    resolutionDate?: Date;
    resolutionNotes?: string;
    acknowledgedBy?: bigint;
    acknowledgedDate?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
    static initModel(sequelize: Sequelize): typeof Warning;
}
export {};
//# sourceMappingURL=Warning.model.d.ts.map