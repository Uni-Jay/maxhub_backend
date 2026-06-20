/**
 * MaxHub ERP — add users.mustChangePassword
 * One-off, idempotent: adds the column (default false) so existing accounts
 * aren't force-logged-out into a password change they never asked for.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-must-change-password.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  const SSL_OPTIONS = { require: true, rejectUnauthorized: false };
  const sequelize = new Sequelize(dbUrl!, {
    dialect: 'postgres',
    logging: false,
    pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
    dialectOptions: { ssl: SSL_OPTIONS },
  });

  await sequelize.authenticate();

  const [existing] = await sequelize.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name = 'users' AND column_name = 'mustChangePassword'`
  );
  if ((existing as any[]).length > 0) {
    console.log('\nℹ️  mustChangePassword already exists — nothing to do.\n');
  } else {
    console.log('\n🔄  Adding users.mustChangePassword (default false)...\n');
    await sequelize.query(`ALTER TABLE users ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;`);
    console.log('✅  mustChangePassword added\n');
  }

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
