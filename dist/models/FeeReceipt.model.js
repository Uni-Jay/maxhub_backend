"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeReceipt = void 0;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
class FeeReceipt extends sequelize_1.Model {
    static initModel(sequelize) {
        FeeReceipt.init({
            id: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false },
            uuid: { type: sequelize_1.DataTypes.UUID, defaultValue: () => (0, uuid_1.v4)(), unique: true, allowNull: false },
            enrollmentId: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'Enrollment ID' },
            receiptNumber: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, unique: true, comment: 'Receipt number' },
            amountPaid: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, comment: 'Amount paid' },
            paymentMethod: { type: sequelize_1.DataTypes.ENUM('Cash', 'BankTransfer', 'POS', 'Online'), allowNull: false },
            paymentDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, comment: 'Date payment was made' },
            session: { type: sequelize_1.DataTypes.STRING(20), allowNull: false, comment: 'Academic session, e.g. 2026/2027' },
            balance: { type: sequelize_1.DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0, comment: 'Remaining balance owed after this payment' },
            status: { type: sequelize_1.DataTypes.ENUM('Paid', 'PartPayment', 'Pending'), defaultValue: 'Paid' },
            notes: { type: sequelize_1.DataTypes.TEXT, allowNull: true },
            issuedById: { type: sequelize_1.DataTypes.BIGINT.UNSIGNED, allowNull: false, comment: 'User who recorded this payment' },
            deletedAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, comment: 'Soft delete timestamp' },
        }, {
            sequelize, tableName: 'fee_receipts', timestamps: true, paranoid: true, underscored: false, freezeTableName: true,
            indexes: [
                { fields: ['enrollmentId'], name: 'idx_fee_receipts_enrollmentId' },
                { fields: ['receiptNumber'], name: 'idx_fee_receipts_receiptNumber' },
                { fields: ['status'], name: 'idx_fee_receipts_status' },
                { fields: ['uuid'], name: 'idx_fee_receipts_uuid' },
            ],
            comment: 'School fee payment receipts, tied to a course enrollment'
        });
        return FeeReceipt;
    }
}
exports.FeeReceipt = FeeReceipt;
//# sourceMappingURL=FeeReceipt.model.js.map