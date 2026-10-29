"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cashRevenueNgn = cashRevenueNgn;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
async function cashRevenueNgn(start, end) {
    const range = (col) => (start && end ? `AND "${col}" >= :start AND "${col}" < :end` : '');
    const one = async (sql) => {
        try {
            const rows = await Database_1.default.query(sql, { replacements: { start, end }, type: sequelize_1.QueryTypes.SELECT });
            return Number(rows[0]?.s || 0);
        }
        catch {
            return 0;
        }
    };
    const [invoicePayments, feeReceipts, receipts] = await Promise.all([
        one(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE "deletedAt" IS NULL AND status = 'Processed' AND COALESCE(currency,'NGN') = 'NGN' ${range('paymentDate')}`),
        one(`SELECT COALESCE(SUM("amountPaid"),0) s FROM fee_receipts WHERE "deletedAt" IS NULL ${range('paymentDate')}`),
        one(`SELECT COALESCE(SUM(COALESCE("amountNgn", CASE WHEN currency = 'NGN' THEN amount END)),0) s FROM erp_payments WHERE status = 'Completed' ${range('paidAt')}`),
    ]);
    return invoicePayments + feeReceipts + receipts;
}
//# sourceMappingURL=revenue.js.map