/**
 * MaxHub ERP — chat feature columns + ENUM values, one-off and idempotent.
 *
 * 1. Adds 'Video', 'Voice', 'Audio' to the ENUM backing messages.messageType
 *    — the live DB only had Text/Image/File/Link/Emoji/Mention, so every
 *    attempt to send a voice note or video threw an invalid-enum-value DB
 *    error and the message was never created at all.
 * 2. Adds attachmentName/attachmentSize/attachmentDuration/starredByUserIds
 *    columns to messages.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-message-features.ts
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

  // ── 1. ENUM values ──────────────────────────────────────────────────────
  const [enums] = await sequelize.query(`
    SELECT t.typname FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'messages' AND a.attname = 'messageType'
    GROUP BY t.typname
  `);
  const typeName = (enums as any[])[0]?.typname;
  if (!typeName) {
    console.error('❌  Could not find the enum type backing messages.messageType');
    process.exit(1);
  }

  const [existingValues] = await sequelize.query(`
    SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = '${typeName}')
  `);
  const existing = new Set((existingValues as any[]).map(r => r.enumlabel));

  for (const value of ['Video', 'Voice', 'Audio']) {
    if (existing.has(value)) {
      console.log(`  ⏭  '${value}' already in ${typeName}`);
    } else {
      await sequelize.query(`ALTER TYPE "${typeName}" ADD VALUE '${value}'`);
      console.log(`  ✅ Added '${value}' to ${typeName}`);
    }
  }

  // ── 2. New columns ───────────────────────────────────────────────────────
  const [cols] = await sequelize.query(`
    SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'
  `);
  const existingCols = new Set((cols as any[]).map(r => r.column_name));

  const newColumns: { name: string; ddl: string }[] = [
    { name: 'attachmentName', ddl: `ALTER TABLE messages ADD COLUMN "attachmentName" VARCHAR(255)` },
    { name: 'attachmentSize', ddl: `ALTER TABLE messages ADD COLUMN "attachmentSize" BIGINT` },
    { name: 'attachmentDuration', ddl: `ALTER TABLE messages ADD COLUMN "attachmentDuration" INTEGER` },
    { name: 'starredByUserIds', ddl: `ALTER TABLE messages ADD COLUMN "starredByUserIds" JSONB DEFAULT '[]'` },
  ];

  for (const col of newColumns) {
    if (existingCols.has(col.name)) {
      console.log(`  ⏭  Column "${col.name}" already exists`);
    } else {
      await sequelize.query(col.ddl);
      console.log(`  ✅ Added column "${col.name}"`);
    }
  }

  console.log('\nDone.');
  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
