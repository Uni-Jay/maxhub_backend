"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalEntry = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class JournalEntry extends sequelize_1.Model {
    static initModel(sequelize) {
        JournalEntry.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            entryCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Entry code' },
            debitAccountId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Debit account ID' },
            creditAccountId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Credit account ID' },
            amount: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Amount' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            referenceDocument: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Reference document' },
            entryDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Entry date' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Posted', 'Reversed', 'Cancelled'), defaultValue: 'Draft' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            postedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Posted by user ID' },
            postedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Post date' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
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
        });
        return JournalEntry;
    }
}
exports.JournalEntry = JournalEntry;
//# sourceMappingURL=JournalEntry.model.js.map