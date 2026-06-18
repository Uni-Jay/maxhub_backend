/**
 * MaxHub ERP — Employee Promotion schema migration
 * One-off script: creates the employee_promotion table (brand new, so plain
 * sequelize.sync() / CREATE TABLE IF NOT EXISTS is enough, no ALTER needed).
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-employee-promotion.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { EmployeePromotion } from '../models/EmployeePromotion.model';

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

  console.log('\n🔄  Creating employee_promotion table...\n');
  EmployeePromotion.initModel(sequelize);
  await sequelize.sync();
  console.log('✅  employee_promotion table ready\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
