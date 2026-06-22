/**
 * Creates the customer_reports table for the new CustomerReport model.
 * Customer Reports had a fully-built frontend with zero backend behind
 * it — every API call silently caught its own failure and faked success
 * with local data, so nothing ever actually persisted. This is the table
 * the new /api/customer-reports routes need.
 *
 * Syncs only this one model (not the whole database) — safe to run
 * regardless of the app's own DB_SYNC setting.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-customer-reports.ts
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { CustomerReport } from '../models/CustomerReport.model';

async function main() {
  const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });

  await sequelize.authenticate();
  CustomerReport.initModel(sequelize);

  await CustomerReport.sync();
  console.log('✅ customer_reports table ready');

  await sequelize.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
