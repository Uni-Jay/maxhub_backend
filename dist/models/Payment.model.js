"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class Payment extends sequelize_1.Model {
    static initModel(sequelize) {
        Payment.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            paymentCode: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Payment code' },
            invoiceId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Invoice ID' },
            accountId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Account ID' },
            paymentDate: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, comment: 'Payment date' },
            amount: { type: sequelize_1.DataTypes.DECIMAL(15, 2), allowNull: false, comment: 'Payment amount' },
            currency: { type: sequelize_1.DataTypes.STRING(3), allowNull: false, defaultValue: 'USD', comment: 'Currency code' },
            paymentMethod: { type: sequelize_1.DataTypes.ENUM('Cash', 'Cheque', 'BankTransfer', 'CreditCard', 'Online', 'Other'), allowNull: false },
            referenceNumber: { type: sequelize_1.DataTypes.STRING(100), allowNull: true, comment: 'Reference number' },
            description: { type: sequelize_1.DataTypes.TEXT, allowNull: true, comment: 'Description' },
            status: { type: sequelize_1.DataTypes.ENUM('Pending', 'Processed', 'Failed', 'Cancelled'), defaultValue: 'Pending' },
            processedBy: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: true, comment: 'Processed by user ID' },
            processedDate: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Process date' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'payments', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['paymentCode'], name: 'idx_payments_paymentCode' },
                { fields: ['invoiceId'], name: 'idx_payments_invoiceId' },
                { fields: ['accountId'], name: 'idx_payments_accountId' },
                { fields: ['paymentMethod'], name: 'idx_payments_paymentMethod' },
                { fields: ['status'], name: 'idx_payments_status' },
                { fields: ['paymentDate'], name: 'idx_payments_paymentDate' },
                { fields: ['uuid'], name: 'idx_payments_uuid' },
            ],
            comment: 'Payments'
        });
        return Payment;
    }
}
exports.Payment = Payment;
//# sourceMappingURL=Payment.model.js.map