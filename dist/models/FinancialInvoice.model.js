"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialInvoice = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class FinancialInvoice extends sequelize_1.Model {
}
exports.FinancialInvoice = FinancialInvoice;
FinancialInvoice.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    clientId: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    clientName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    invoiceNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    invoiceDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    dueDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    subtotal: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    taxPercentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    taxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: true,
    },
    discountPercentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    discountAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    amountPaid: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
    },
    remainingAmount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Cancelled'),
        defaultValue: 'Draft',
    },
    paymentTerms: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    issuedBy: {
        type: sequelize_1.DataTypes.BIGINT,
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
    tableName: 'financial_invoice',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'status'] },
        { fields: ['invoiceNumber'] },
        { fields: ['dueDate'] },
    ],
});
exports.default = FinancialInvoice;
//# sourceMappingURL=FinancialInvoice.model.js.map