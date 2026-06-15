"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentAllocation = void 0;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
class PaymentAllocation extends sequelize_1.Model {
}
exports.PaymentAllocation = PaymentAllocation;
PaymentAllocation.init({
    id: {
        type: sequelize_1.DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },
    organizationId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
    },
    paymentId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to financial_payment',
    },
    invoiceId: {
        type: sequelize_1.DataTypes.BIGINT,
        allowNull: false,
        comment: 'FK to financial_invoice',
    },
    amountAllocated: {
        type: sequelize_1.DataTypes.DECIMAL(15, 2),
        allowNull: false,
        validate: { min: 0 },
    },
    allocationDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
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
    tableName: 'payment_allocation',
    paranoid: true,
    timestamps: true,
    indexes: [
        { fields: ['organizationId', 'paymentId'] },
        { fields: ['invoiceId'] },
        {
            fields: ['paymentId', 'invoiceId'],
            unique: true,
            name: 'uq_payment_allocation_unique',
        },
    ],
});
exports.default = PaymentAllocation;
//# sourceMappingURL=PaymentAllocation.model.js.map