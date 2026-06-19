/**
 * MaxHub ERP — make staff.designationId and staff.locationId optional
 * One-off, idempotent: drops the NOT NULL constraint on both columns.
 *
 * Why: POST /api/staff defaulted both to BigInt(1) when not supplied (the
 * frontend form never even collects a locationId, and designationId is only
 * set when a designation is picked from a list that's currently empty in
 * this DB). Since neither `designations` nor `locations` has a row with
 * id=1, every staff creation hit a foreign key violation on Staff.create()
 * AFTER User.create() had already committed — leaving an orphaned User with
 * no matching Staff row, while the request surfaced as a failure.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-staff-designation-location-optional.ts
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

  console.log('\n🔄  Dropping NOT NULL on staff.designationId and staff.locationId...\n');
  await sequelize.query(`ALTER TABLE staff ALTER COLUMN "designationId" DROP NOT NULL;`);
  await sequelize.query(`ALTER TABLE staff ALTER COLUMN "locationId" DROP NOT NULL;`);
  console.log('✅  designationId and locationId are now optional\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
