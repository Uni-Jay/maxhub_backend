/**
 * MaxHub ERP — remove the term requirement from fee_receipts, add balance.
 * One-off, idempotent.
 *
 * Why: The Add Receipt form required picking a term (First/Second/Third),
 * which the user wants gone entirely. Replaced with a "balance" input so
 * staff can record how much the student still owes after this payment.
 * term's NOT NULL constraint is dropped (column left in place, unused —
 * not dropped outright so historical receipts keep their data) and a new
 * balance column is added, defaulting existing rows to 0.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-fee-receipt-balance.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';

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

  console.log('\n🔄  Dropping NOT NULL on fee_receipts.term, adding fee_receipts.balance...\n');
  await sequelize.query(`ALTER TABLE fee_receipts ALTER COLUMN term DROP NOT NULL;`);
  await sequelize.query(`ALTER TABLE fee_receipts ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) NOT NULL DEFAULT 0;`);
  console.log('✅  fee_receipts.balance is live\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
