/**
 * MaxHub ERP — make payments.accountId optional.
 * One-off, idempotent.
 *
 * Why: POST /invoices/:id/payments has never been able to successfully
 * create a Payment row — accountId was NOT NULL but the route never set it
 * (real invoices link via clientId, not the legacy Account model, which has
 * zero rows in production). The route also never set the required
 * paymentCode and used an invalid status value ('Completed' instead of the
 * model's 'Processed'), fixed alongside this migration.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-payment-account-optional.ts
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

  console.log('\n🔄  Dropping NOT NULL on payments.accountId...\n');
  await sequelize.query(`ALTER TABLE payments ALTER COLUMN "accountId" DROP NOT NULL;`);
  console.log('✅  payments.accountId is now optional\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
