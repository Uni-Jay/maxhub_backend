"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinancialPayment = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class FinancialPayment extends sequelize_1.Model {
}
exports.FinancialPayment = FinancialPayment;
FinancialPayment.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    invoiceId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    paymentNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
        unique: true,
    },
    paymentDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    paymentType: {
        type: sequelize_1.DataTypes.ENUM('Income', 'Expense', 'Salary', 'Vendor', 'Other'),
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    paymentMethod: {
        type: sequelize_1.DataTypes.ENUM('Bank Transfer', 'Check', 'Cash', 'Card', 'Digital Wallet'),
        allowNull: false,
    },
    transactionReference: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: false,
    },
    paymentStatus: {
        type: sequelize_1.DataTypes.ENUM('Pending', 'Processed', 'Completed', 'Failed', 'Cancelled'),
        defaultValue: 'Pending',
    },
    fromAccount: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    toAccount: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    bankName: {
        type: sequelize_1.DataTypes.STRING(100),
        allowNull: true,
    },
    chequeNumber: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    recipientName: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    processedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    approvedBy: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
    },
    attachmentUrl: {
        type: sequelize_1.DataTypes.STRING(500),
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
    tableName: 'financial_payment',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'paymentDate'] },
        { fields: ['paymentNumber'] },
        { fields: ['paymentStatus'] },
    ],
});
exports.default = FinancialPayment;
//# sourceMappingURL=FinancialPayment.model.js.map