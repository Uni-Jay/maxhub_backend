/**
 * MaxHub ERP — add meetings.meetingLink (Google Meet replaces the embedded
 * Jitsi rooms). The meetings table has zero existing rows in this DB, so the
 * column is added NOT NULL directly with no backfill needed.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-meeting-google-meet-link.ts
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

  const [existing] = await sequelize.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'meetings' AND column_name = 'meetingLink'`
  );
  if ((existing as any[]).length > 0) {
    console.log('\nℹ️  meetingLink already exists — nothing to do.\n');
  } else {
    console.log('\n🔄  Adding meetings.meetingLink (NOT NULL, table is currently empty)...\n');
    await sequelize.query(`ALTER TABLE meetings ADD COLUMN "meetingLink" VARCHAR(500) NOT NULL DEFAULT '';`);
    await sequelize.query(`ALTER TABLE meetings ALTER COLUMN "meetingLink" DROP DEFAULT;`);
    console.log('✅  meetingLink added\n');
  }

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
