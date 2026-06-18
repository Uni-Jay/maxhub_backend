/**
 * MaxHub ERP — Weekly Reports schema migration
 * One-off script: creates the weekly_reports table (brand new, so plain
 * sequelize.sync() / CREATE TABLE IF NOT EXISTS is enough, no ALTER needed).
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-weekly-reports.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { WeeklyReport } from '../models/WeeklyReport.model';

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

  console.log('\n🔄  Creating weekly_reports table...\n');
  WeeklyReport.initModel(sequelize);
  await sequelize.sync();
  console.log('✅  weekly_reports table ready\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
