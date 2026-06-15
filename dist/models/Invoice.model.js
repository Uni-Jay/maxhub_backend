"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Invoice extends sequelize_1.Model {
    static initModel(sequelize) {
        Invoice.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            invoiceCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Invoice code' },
            orderId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Order ID' },
            accountId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Account ID' },
            invoiceDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Invoice date' },
            dueDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Due date' },
            subtotal: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Subtotal' },
            discount: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Discount' },
            tax: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Tax' },
            total: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Total' },
            currency: { type: sequelize_1.DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Issued', 'PartiallyPaid', 'Paid', 'Overdue', 'Cancelled'), defaultValue: 'Draft' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'invoices', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['invoiceCode'], name: 'idx_invoices_invoiceCode' },
                { fields: ['orderId'], name: 'idx_invoices_orderId' },
                { fields: ['accountId'], name: 'idx_invoices_accountId' },
                { fields: ['status'], name: 'idx_invoices_status' },
                { fields: ['dueDate'], name: 'idx_invoices_dueDate' },
                { fields: ['createdById'], name: 'idx_invoices_createdById' },
                { fields: ['uuid'], name: 'idx_invoices_uuid' },
            ],
            comment: 'Invoices'
        });
        return Invoice;
    }
}
exports.Invoice = Invoice;
//# sourceMappingURL=Invoice.model.js.map