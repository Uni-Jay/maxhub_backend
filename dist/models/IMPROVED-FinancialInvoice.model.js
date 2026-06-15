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
    departmentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'RBAC: Department tracking for access control',
    },
    customerId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Customer for internal billing',
    },
    clientId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'External client reference',
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
        comment: 'Summary; line items stored in separate table',
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
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
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
        allowNull: false,
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
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    issuedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff who issued invoice',
    },
    approvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff who approved invoice',
    },
    approvalDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    paymentDeadline: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        comment: 'Date for payment deadline tracking',
    },
    lastReminderSent: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    notes: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    attachmentUrl: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: true,
    },
    createdBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff for audit trail',
    },
    updatedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to Staff for audit trail',
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
        { fields: ['invoiceDate'] },
        { fields: ['dueDate'] },
        { fields: ['departmentId'] },
        { fields: ['customerId'] },
        {
            fields: ['organizationId', 'status', 'invoiceDate'],
            name: 'idx_invoice_org_status_date',
        },
    ],
});
exports.default = FinancialInvoice;
//# sourceMappingURL=IMPROVED-FinancialInvoice.model.js.map