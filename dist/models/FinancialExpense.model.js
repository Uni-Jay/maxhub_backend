"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialExpense = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class FinancialExpense extends sequelize_1.Model {
}
exports.FinancialExpense = FinancialExpense;
FinancialExpense.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    expenseDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    expenseCategory: {
        type: sequelize_1.DataTypes.ENUM('Salary', 'Utilities', 'Rent', 'Supplies', 'Maintenance', 'Travel', 'Other'),
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    vendorName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    vendorInvoiceNumber: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('Cash', 'Card', 'Transfer', 'Cheque'),
        allowNull: true,
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Paid', 'Failed'),
        defaultValue: 'Pending',
    },
    paymentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    attachmentUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    requestedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvalStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
        defaultValue: 'Pending',
    },
    approvalDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    deletedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
}, {
    sequelize: Database_1.default,
    tableName: 'financial_expense',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'expenseDate'] },
        { fields: ['departmentId'] },
        { fields: ['approvalStatus'] },
    ],
});
exports.default = FinancialExpense;
//# sourceMappingURL=FinancialExpense.model.js.map