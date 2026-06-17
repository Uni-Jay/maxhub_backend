/**
 * MaxHub ERP — Job Sync schema migration
 * One-off, idempotent script: adds the sync-tracking columns to job_postings
 * (sequelize.sync() only does CREATE TABLE IF NOT EXISTS, it never alters an
 * existing table) and creates the new job_sync_logs table.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-job-sync.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { JobSyncLog } from '../models/JobSyncLog.model';

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

  console.log('\n🔄  Adding sync columns to job_postings...\n');
  await sequelize.query(`
    ALTER TABLE job_postings
      ADD COLUMN IF NOT EXISTS "businessUnit" VARCHAR(10),
      ADD COLUMN IF NOT EXISTS "syncStatus" VARCHAR(20) NOT NULL DEFAULT 'Pending',
      ADD COLUMN IF NOT EXISTS "externalJobId" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "syncAttempts" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "lastSyncedAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS "lastSyncError" TEXT;
  `);
  await sequelize.query(`
    CREATE INDEX IF NOT EXISTS "idx_job_postings_syncStatus" ON job_postings ("syncStatus");
  `);
  console.log('✅  job_postings columns added\n');

  console.log('🔄  Creating job_sync_logs table...\n');
  JobSyncLog.initModel(sequelize);
  await sequelize.sync();
  console.log('✅  job_sync_logs table ready\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
