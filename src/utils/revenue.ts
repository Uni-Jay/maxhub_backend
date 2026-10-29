import { QueryTypes } from 'sequelize';
import sequelize from '@config/Database';

/**
 * The single definition of "revenue" (cash actually received, in naira) used
 * by the dashboards, the revenue chart, analytics and the AI assistant — so
 * every screen shows the same figure as the receipts:
 *   invoice payments (status Processed)
 * + student fee receipts (amountPaid)
 * + Payments & Receipts (status Completed — foreign currency counted at its
 *   naira value on the day it was received)
 * Optional range is half-open: [start, end).
 */
export async function cashRevenueNgn(start?: Date, end?: Date): Promise<number> {
  const range = (col: string) => (start && end ? `AND "${col}" >= :start AND "${col}" < :end` : '');
  const one = async (sql: string) => {
    try {
      const rows: any[] = await sequelize.query(sql, { replacements: { start, end }, type: QueryTypes.SELECT });
      return Number(rows[0]?.s || 0);
    } catch {
      return 0; // table may not exist on older databases
    }
  };
  const [invoicePayments, feeReceipts, receipts] = await Promise.all([
    one(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE "deletedAt" IS NULL AND status = 'Processed' AND COALESCE(currency,'NGN') = 'NGN' ${range('paymentDate')}`),
    one(`SELECT COALESCE(SUM("amountPaid"),0) s FROM fee_receipts WHERE "deletedAt" IS NULL ${range('paymentDate')}`),
    one(`SELECT COALESCE(SUM(COALESCE("amountNgn", CASE WHEN currency = 'NGN' THEN amount END)),0) s FROM erp_payments WHERE status = 'Completed' ${range('paidAt')}`),
  ]);
  return invoicePayments + feeReceipts + receipts;
}
