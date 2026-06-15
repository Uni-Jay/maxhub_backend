"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceLineItem = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class InvoiceLineItem extends sequelize_1.Model {
}
exports.InvoiceLineItem = InvoiceLineItem;
InvoiceLineItem.init({
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
        allowNull: false,
        comment: 'FK to financial_invoice',
    },
    productId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: true,
        comment: 'FK to product table',
    },
    lineNumber: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        comment: 'Display order in invoice',
    },
    description: {
        type: sequelize_1.DataTypes.STRING(500),
        allowNull: false,
    },
    quantity: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    unitPrice: {
        type: sequelize_1.DataTypes.DECIMAL(12, 2),
        allowNull: false,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: 'quantity * unitPrice',
    },
    taxPercentage: {
        type: sequelize_1.DataTypes.DECIMAL(5, 2),
        allowNull: true,
    },
    taxAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
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
    tableName: 'invoice_line_item',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'invoiceId'] },
        { fields: ['productId'] },
        { fields: ['invoiceId', 'lineNumber'] },
    ],
});
exports.default = InvoiceLineItem;
//# sourceMappingURL=InvoiceLineItem.model.js.map