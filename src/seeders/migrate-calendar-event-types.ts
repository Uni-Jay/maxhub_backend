/**
 * MaxHub ERP — add the missing calendar_events.type ENUM values.
 * One-off, idempotent.
 *
 * Why: the frontend's event-type picker offers Meeting/Leave/Holiday/
 * Birthday/Deadline/Training, but the Postgres enum only ever had
 * Meeting/Task/Reminder/Holiday/Other - picking Leave, Birthday, Deadline
 * or Training (4 of the 6 real options) threw a DB error creating the
 * event, surfaced to the user as a 500. Postgres enum values can only be
 * added, not removed, without recreating the type - the old Task/Reminder/
 * Other values are left in place since nothing used them and removing them
 * isn't worth the extra risk.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-calendar-event-types.ts
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

  console.log('\n🔄  Adding missing calendar_events.type enum values...\n');
  for (const value of ['Leave', 'Birthday', 'Deadline', 'Training']) {
    await sequelize.query(`ALTER TYPE enum_calendar_events_type ADD VALUE IF NOT EXISTS '${value}';`);
    console.log(`   + ${value}`);
  }
  console.log('\n✅  calendar_events.type now accepts all frontend options\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
