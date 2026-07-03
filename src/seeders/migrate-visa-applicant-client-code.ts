/**
 * MaxHub ERP — add client_code (human-friendly "VMC-001" style ID) to visa_applicant.
 * One-off, idempotent.
 *
 * Why: VisaMax clients only ever had the raw numeric DB id, never shown anywhere
 * in the UI, so staff had no visible reference number to identify/search a client
 * by. Adds a unique, sequential "VMC-XXX" code, generated here for existing rows
 * (ordered by id) and by the create route for every new one going forward.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-visa-applicant-client-code.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize, QueryTypes } from 'sequelize';

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

  console.log('\n🔄  Adding visa_applicant.client_code...\n');
  await sequelize.query(`ALTER TABLE visa_applicant ADD COLUMN IF NOT EXISTS client_code VARCHAR(20);`);

  const rows = await sequelize.query<{ id: string }>(
    `SELECT id FROM visa_applicant WHERE client_code IS NULL ORDER BY id ASC`,
    { type: QueryTypes.SELECT }
  );

  const [[{ max_num }]] = (await sequelize.query(
    `SELECT COALESCE(MAX(CAST(SUBSTRING(client_code FROM 5) AS INTEGER)), 0) AS max_num FROM visa_applicant WHERE client_code ~ '^VMC-[0-9]+$'`
  )) as any;

  let next = Number(max_num) + 1;
  for (const row of rows) {
    const code = `VMC-${String(next).padStart(3, '0')}`;
    await sequelize.query(`UPDATE visa_applicant SET client_code = :code WHERE id = :id`, {
      replacements: { code, id: row.id },
    });
    console.log(`  ${row.id} -> ${code}`);
    next++;
  }

  await sequelize.query(`ALTER TABLE visa_applicant ALTER COLUMN client_code SET NOT NULL;`);
  await sequelize.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_visa_applicant_client_code ON visa_applicant(client_code);`);
  console.log(`\n✅  visa_applicant.client_code is live (${rows.length} row(s) backfilled)\n`);

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
