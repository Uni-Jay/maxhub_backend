/**
 * MaxHub ERP — add 'PASSWORD_CHANGE' to the otp_verifications.type ENUM
 * One-off, idempotent.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-otp-password-change-type.ts
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

  // Find the actual enum type name backing otp_verifications.type (Sequelize
  // auto-names it, usually enum_otp_verifications_type).
  const [enums] = await sequelize.query(`
    SELECT t.typname FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'otp_verifications' AND a.attname = 'type'
    GROUP BY t.typname
  `);

  const typeName = (enums as any[])[0]?.typname;
  if (!typeName) {
    console.error('\n❌  Could not find the enum type backing otp_verifications.type\n');
    process.exit(1);
  }

  const [existingValues] = await sequelize.query(
    `SELECT enumlabel FROM pg_enum WHERE enumtypid = '${typeName}'::regtype`
  );
  if ((existingValues as any[]).some((r: any) => r.enumlabel === 'PASSWORD_CHANGE')) {
    console.log('\nℹ️  PASSWORD_CHANGE already exists — nothing to do.\n');
  } else {
    console.log(`\n🔄  Adding 'PASSWORD_CHANGE' to enum ${typeName}...\n`);
    await sequelize.query(`ALTER TYPE "${typeName}" ADD VALUE 'PASSWORD_CHANGE';`);
    console.log('✅  Added\n');
  }

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
