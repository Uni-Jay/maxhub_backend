import { DataTypes, Model, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

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

interface JournalEntryCreationAttributes extends Optional<JournalEntryAttributes, 'id' | 'uuid'> {}

export class JournalEntry extends Model<JournalEntryAttributes, JournalEntryCreationAttributes>
  implements JournalEntryAttributes {
  public id!: bigint;
  public uuid!: string;
  public entryCode!: string;
  public debitAccountId!: bigint;
  public creditAccountId!: bigint;
  public amount!: number;
  public description?: string;
  public referenceDocument?: string;
  public entryDate!: Date;
  public status!: 'Draft' | 'Posted' | 'Reversed' | 'Cancelled';
  public createdById!: bigint;
  public postedBy?: bigint;
  public postedDate?: Date;
  public deletedAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static initModel(sequelize: Sequelize): typeof JournalEntry {
    JournalEntry.init(
      {
        id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
        uuid: { type: DataTypes.UUID, defaultValue: () => uuidv4(), unique: true, allowNull: false },
        entryCode: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Entry code' },
        debitAccountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Debit account ID' },
        creditAccountId: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Credit account ID' },
        amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Amount' },
        description: { type: DataTypes.TEXT, allowNull: true, comment: 'Description' },
        referenceDocument: { type: DataTypes.STRING(100), allowNull: true, comment: 'Reference document' },
        entryDate: { type: DataTypes.DATE, allowNull: false, comment: 'Entry date' },
        status: { type: DataTypes.ENUM('Draft', 'Posted', 'Reversed', 'Cancelled'), defaultValue: 'Draft' },
        createdById: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
        postedBy: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Posted by user ID' },
        postedDate: { type: DataTypes.DATE, allowNull: true, comment: 'Post date' },
        deletedAt: { type: DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
      },
      {
        sequelize, tableName: 'journal_entries', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
        indexes: [
          { fields: ['entryCode'], name: 'idx_journal_entries_entryCode' },
          { fields: ['debitAccountId'], name: 'idx_journal_entries_debitAccountId' },
          { fields: ['creditAccountId'], name: 'idx_journal_entries_creditAccountId' },
          { fields: ['status'], name: 'idx_journal_entries_status' },
          { fields: ['entryDate'], name: 'idx_journal_entries_entryDate' },
          { fields: ['createdById'], name: 'idx_journal_entries_createdById' },
          { fields: ['uuid'], name: 'idx_journal_entries_uuid' },
        ],
        comment: 'Accounting journal entries'
      }
    );
    return JournalEntry;
  }
}
