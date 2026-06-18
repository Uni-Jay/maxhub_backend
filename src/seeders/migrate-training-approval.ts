/**
 * MaxHub ERP — Training program approval tracking
 * Adds training_programs.approvedAt / approvedById, set when a Draft program
 * is activated (the existing Super-Admin-only Draft->Active transition).
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-training-approval.ts
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

  console.log('\n🔄  Adding training_programs.approvedAt / approvedById...\n');
  await sequelize.query('ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP WITH TIME ZONE');
  await sequelize.query('ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS "approvedById" BIGINT');
  console.log('✅  columns ready\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
