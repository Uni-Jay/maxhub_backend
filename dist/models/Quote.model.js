"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quote = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Quote extends sequelize_1.Model {
    static initModel(sequelize) {
        Quote.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            quoteCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Quote code' },
            opportunityId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Opportunity ID' },
            accountId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Account ID' },
            contactId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Contact ID' },
            clientId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Client ID (CRM customer this proposal is for)' },
            departmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Department/business unit, denormalized from client at creation for fast scoping' },
            title: { type: sequelize_1.DataTypes.STRING(200), allowNull: true, comment: 'Proposal title' },
            scopeOfWork: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'What we will deliver' },
            termsAndConditions: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Our terms and conditions for this engagement' },
            items: { type: sequelize_1.DataTypes.JSONB, allowNull: true, comment: 'Line items: [{description, qty, unitPrice}]' },
            quoteDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Quote date' },
            validUntil: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Valid until date' },
            subtotal: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
            discount: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
            tax: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
            total: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total' },
            currency: { type: sequelize_1.DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'), defaultValue: 'Draft' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            sentAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'When this was emailed to the client' },
            respondedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'When the client accepted/rejected' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'quotes', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['quoteCode'], name: 'idx_quotes_quoteCode' },
                { fields: ['opportunityId'], name: 'idx_quotes_opportunityId' },
                { fields: ['accountId'], name: 'idx_quotes_accountId' },
                { fields: ['clientId'], name: 'idx_quotes_clientId' },
                { fields: ['departmentId'], name: 'idx_quotes_departmentId' },
                { fields: ['status'], name: 'idx_quotes_status' },
                { fields: ['validUntil'], name: 'idx_quotes_validUntil' },
                { fields: ['createdById'], name: 'idx_quotes_createdById' },
                { fields: ['uuid'], name: 'idx_quotes_uuid' },
            ],
            comment: 'Sales quotes / client proposals'
        });
        return Quote;
    }
}
exports.Quote = Quote;
//# sourceMappingURL=Quote.model.js.map