import { Model, Optional, Sequelize } from 'sequelize';
interface JournalEntryAttributes {
    id: bigint;
    uuid: string;
    entryCode: string;
    debitAccountId: bigint;
    creditAccountId: bigint;
    amount: number;
    description?: string;
    referenceDocument?: string;
    entryDate: Date;
    status: 'Draft' | 'Posted' | 'Reversed' | 'Cancelled';
    createdById: bigint;
    postedBy?: bigint;
    postedDate?: Date;
    deletedAt?: Date;
}
interface JournalEntryCreationAttributes extends Optional<JournalEntryAttributes, 'id' | 'uuid'> {
}
export declare class JournalEntry extends Model<JournalEntryAttributes, JournalEntryCreationAttributes> implements JournalEntryAttributes {
    id: bigint;
    uuid: string;
    entryCode: string;
    debitAccountId: bigint;
    creditAccountId: bigint;
    amount: number;
    description?: string;
    referenceDocument?: string;
    entryDate: Date;
    status: 'Draft' | 'Posted' | 'Reversed' | 'Cancelled';
    createdById: bigint;
    postedBy?: bigint;
    postedDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof JournalEntry;
}
export {};
//# sourceMappingURL=JournalEntry.model.d.ts.map