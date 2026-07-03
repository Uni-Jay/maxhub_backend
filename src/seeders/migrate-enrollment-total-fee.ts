/**
 * MaxHub ERP — add total_fee to enrollments; recompute fee_receipts.balance from real data.
 * One-off, idempotent.
 *
 * Why: fee_receipts.balance was a free-text number staff typed by hand on each
 * payment, with nothing anchoring it to an actual agreed course fee. It drifts
 * the moment more than one receipt exists for the same enrollment, and there was
 * no single "amount paid so far" figure anywhere — which is how a student who'd
 * actually paid 200,000 ended up with a screen showing 300,000 (that number was
 * really `amountPaid + stale balance` from an old receipt, not a real total).
 *
 * Adds enrollments.total_fee (nullable — falls back to the course's `fee` when
 * unset) as the one authoritative "what this student owes in total" figure.
 * Every fee_receipts.balance is then recomputed server-side as
 * total_fee - cumulative amountPaid (see fee-receipt.routes.ts), so it can never
 * go stale again.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-enrollment-total-fee.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize, QueryTypes } from 'sequelize';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const SSL_OPTIONS = { require: true, rejectUnauthorized: false };

  const sequelize = dbUrl
    ? new Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
        dialectOptions: { ssl: SSL_OPTIONS },
      })
    : new Sequelize({
        host: process.env.DB_HOST!,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
        dialect: 'postgres',
        logging: false,
        pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
        dialectOptions: { ssl: SSL_OPTIONS },
      });

  await sequelize.authenticate();

  console.log('\n🔄  Adding enrollments.total_fee...\n');
  await sequelize.query(`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS total_fee DECIMAL(12,2);`);
  console.log('✅  enrollments.total_fee is live\n');

  // Backfill: for every enrollment that already has fee receipts, the total fee
  // this student actually agreed to is best reconstructed from their most
  // recent receipt (amountPaid-to-date + balance-remaining-at-that-point),
  // since that's the number staff were manually keeping consistent. Falls back
  // to the course's list `fee` for enrollments with no receipts yet.
  const enrollmentsWithReceipts = await sequelize.query<{ enrollment_id: string }>(
    `SELECT DISTINCT "enrollmentId" AS enrollment_id FROM fee_receipts`,
    { type: QueryTypes.SELECT }
  );

  for (const { enrollment_id } of enrollmentsWithReceipts) {
    const receipts = await sequelize.query<{ amount_paid: string; balance: string; payment_date: string }>(
      `SELECT "amountPaid" AS amount_paid, balance, "paymentDate" AS payment_date FROM fee_receipts
       WHERE "enrollmentId" = :enrollmentId ORDER BY "paymentDate" ASC, id ASC`,
      { type: QueryTypes.SELECT, replacements: { enrollmentId: enrollment_id } }
    );

    let cumulativePaid = 0;
    for (const r of receipts) cumulativePaid += Number(r.amount_paid);
    const latestBalance = Number(receipts[receipts.length - 1].balance);
    const totalFee = cumulativePaid + latestBalance;

    await sequelize.query(`UPDATE enrollments SET total_fee = :totalFee WHERE id = :id`, {
      replacements: { totalFee, id: enrollment_id },
    });
    console.log(`  enrollment ${enrollment_id}: total_fee = ${totalFee} (paid so far = ${cumulativePaid})`);

    // Recompute every receipt's balance as a proper running total so old,
    // stale balances (e.g. an earlier receipt's balance that ignored later
    // payments) can never be misread as "how much is still owed" again.
    let runningPaid = 0;
    for (const r of receipts) {
      runningPaid += Number(r.amount_paid);
      const correctedBalance = Math.max(totalFee - runningPaid, 0);
      await sequelize.query(
        `UPDATE fee_receipts SET balance = :balance WHERE "enrollmentId" = :enrollmentId AND "paymentDate" = :paymentDate`,
        { replacements: { balance: correctedBalance, enrollmentId: enrollment_id, paymentDate: r.payment_date } }
      );
    }
  }

  console.log(`\n✅  Backfilled total_fee + corrected running balances for ${enrollmentsWithReceipts.length} enrollment(s)\n`);

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
