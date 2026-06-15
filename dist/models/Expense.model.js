"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Expense = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Expense extends sequelize_1.Model {
    static initModel(sequelize) {
        Expense.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            expenseCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Expense code' },
            staffId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Staff ID' },
            expenseDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Expense date' },
            category: { type: sequelize_1.DataTypes.STRING(100), allowNull: false, comment: 'Category' },
            amount: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, comment: 'Amount' },
            currency: { type: sequelize_1.DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            receiptUrl: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Receipt URL/path' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Submitted', 'Approved', 'Rejected', 'Reimbursed'), defaultValue: 'Draft' },
            submittedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Submission date' },
            approvedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
            approvedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Approval date' },
            reimbursedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Reimbursement date' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'expenses', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['expenseCode'], name: 'idx_expenses_expenseCode' },
                { fields: ['staffId'], name: 'idx_expenses_staffId' },
                { fields: ['category'], name: 'idx_expenses_category' },
                { fields: ['status'], name: 'idx_expenses_status' },
                { fields: ['expenseDate'], name: 'idx_expenses_expenseDate' },
                { fields: ['uuid'], name: 'idx_expenses_uuid' },
            ],
            comment: 'Employee expenses and claims'
        });
        return Expense;
    }
}
exports.Expense = Expense;
//# sourceMappingURL=Expense.model.js.map