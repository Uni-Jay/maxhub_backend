"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Budget = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Budget extends sequelize_1.Model {
    static initModel(sequelize) {
        Budget.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            budgetCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Budget code' },
            budgetName: { type: sequelize_1.DataTypes.STRING(200), allowNull: false, comment: 'Budget name' },
            departmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Department ID' },
            fiscalYear: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, comment: 'Fiscal year' },
            startDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'Start date' },
            endDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, comment: 'End date' },
            amount: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Budget amount' },
            spent: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Amount spent' },
            reserved: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0, comment: 'Amount reserved' },
            status: { type: sequelize_1.DataTypes.ENUM('Draft', 'Approved', 'Active', 'Closed', 'Cancelled'), defaultValue: 'Draft' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            approvedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Approved by user ID' },
            approvedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Approval date' },
            createdById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Created by user ID' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'budgets', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['budgetCode'], name: 'idx_budgets_budgetCode' },
                { fields: ['departmentId'], name: 'idx_budgets_departmentId' },
                { fields: ['fiscalYear'], name: 'idx_budgets_fiscalYear' },
                { fields: ['status'], name: 'idx_budgets_status' },
                { fields: ['uuid'], name: 'idx_budgets_uuid' },
            ],
            comment: 'Budgets'
        });
        return Budget;
    }
}
exports.Budget = Budget;
//# sourceMappingURL=Budget.model.js.map