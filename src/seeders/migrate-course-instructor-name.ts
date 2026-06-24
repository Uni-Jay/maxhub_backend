/**
 * MaxHub ERP — add courses.instructorName, make courses.instructorId optional.
 * One-off, idempotent.
 *
 * Why: Add Course required picking an instructor from the Staff dropdown,
 * but most instructors aren't registered staff. instructorId is now optional
 * (kept for the cases where an instructor *is* staff) and instructorName is
 * a free-text column backfilled from any existing linked Staff/User name so
 * old courses keep displaying correctly.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-course-instructor-name.ts
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

  console.log('\n🔄  Adding courses.instructorName, dropping NOT NULL on courses.instructorId...\n');

  await sequelize.query(`ALTER TABLE courses ADD COLUMN IF NOT EXISTS "instructorName" VARCHAR(200);`);
  await sequelize.query(`ALTER TABLE courses ALTER COLUMN "instructorId" DROP NOT NULL;`);

  console.log('🔄  Backfilling instructorName for existing courses from linked Staff/User...\n');
  await sequelize.query(`
    UPDATE courses c
    SET "instructorName" = TRIM(CONCAT(u."firstName", ' ', u."lastName"))
    FROM staff s
    JOIN users u ON u.id = s."userId"
    WHERE c."instructorId" = s.id AND c."instructorName" IS NULL;
  `);
  await sequelize.query(`UPDATE courses SET "instructorName" = 'Unknown Instructor' WHERE "instructorName" IS NULL;`);
  await sequelize.query(`ALTER TABLE courses ALTER COLUMN "instructorName" SET NOT NULL;`);

  console.log('✅  courses.instructorName is live and backfilled\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
