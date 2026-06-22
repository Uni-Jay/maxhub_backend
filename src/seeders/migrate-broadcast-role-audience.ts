/**
 * MaxHub ERP — adds 'Role' to the ENUM backing broadcasts.audienceType.
 *
 * Broadcasts could only ever target Everyone/a BusinessUnit/a Department —
 * there was no way to send one to just "all staff" or just "all HODs", so
 * every announcement either reached the whole company or had to be aimed
 * at a department instead of the role the sender actually meant. The live
 * DB enum doesn't have 'Role' yet, so attempting one throws an invalid-
 * enum-value DB error.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-broadcast-role-audience.ts
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
  console.log('Connected.\n');

  const [enums] = await sequelize.query(`
    SELECT t.typname FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'broadcasts' AND a.attname = 'audienceType'
    GROUP BY t.typname
  `);
  const typeName = (enums as any[])[0]?.typname;
  if (!typeName) {
    console.error('❌  Could not find the enum type backing broadcasts.audienceType');
    process.exit(1);
  }

  const [existingValues] = await sequelize.query(`
    SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '${typeName}')
  `);
  const existing = new Set((existingValues as any[]).map((r) => r.enumlabel));

  if (existing.has('Role')) {
    console.log(`  ⏭  'Role' already in ${typeName}`);
  } else {
    await sequelize.query(`ALTER TYPE "${typeName}" ADD VALUE 'Role'`);
    console.log(`  ✅ Added 'Role' to ${typeName}`);
  }

  console.log('\nDone.');
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
