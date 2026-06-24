/**
 * MaxHub ERP — add enrollments.studentId, make enrollments.staffId optional.
 * One-off, idempotent.
 *
 * Why: Enrollment was Staff-only (staffId, NOT NULL), but most LMS course
 * enrollments are real students (StudentProfile), who have no Staff row.
 * That meant "Enroll Student" pickers and fee-receipt student names were
 * built from /staff and showed staff, not the registered students. staffId
 * is now optional (kept for any legitimate staff-training enrollments);
 * studentId is the new column used going forward.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-enrollment-student-id.ts
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

  console.log('\n🔄  Adding enrollments.studentId, dropping NOT NULL on enrollments.staffId...\n');
  await sequelize.query(`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS "studentId" BIGINT;`);
  await sequelize.query(`ALTER TABLE enrollments ALTER COLUMN "staffId" DROP NOT NULL;`);
  console.log('✅  enrollments.studentId is live\n');

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
