/**
 * MaxHub ERP — File Manager folder simplification
 * - Adds file_records.folderType ('Personal' | 'General').
 * - Ensures a single shared "General Folder" exists.
 * - Re-parents every existing file into the General Folder (preserves real uploads).
 * - Deletes every other pre-existing folder row (the old hardcoded-style folders).
 * Per-user "My Folder" rows are created lazily on first API call — not seeded here.
 *
 * Run: npx ts-node --transpile-only --require tsconfig-paths/register src/seeders/migrate-file-folders.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { FileRecord } from '../models/FileRecord.model';

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

  console.log('\n🔄  Adding file_records.folderType column...\n');
  FileRecord.initModel(sequelize);
  await sequelize.query(`
    DO $$ BEGIN
      CREATE TYPE "enum_file_records_folderType" AS ENUM ('Personal', 'General');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await sequelize.query(`
    ALTER TABLE file_records ADD COLUMN IF NOT EXISTS "folderType" "enum_file_records_folderType";
  `);
  console.log('✅  folderType column ready\n');

  console.log('🔄  Ensuring General Folder exists...\n');
  let general = await FileRecord.findOne({ where: { isFolder: true, folderType: 'General' } });
  if (!general) {
    general = await FileRecord.create({
      uuid: uuidv4(), name: 'General Folder', isFolder: true, folderType: 'General', icon: '📁', size: 0,
    } as any);
  }
  console.log(`✅  General Folder uuid: ${general.uuid}\n`);

  console.log('🔄  Re-parenting existing files into General Folder...\n');
  const [reparented] = await FileRecord.update(
    { folderId: general.uuid },
    { where: { isFolder: false } }
  );
  console.log(`✅  Re-parented ${reparented} file(s)\n`);

  console.log('🔄  Removing old folders (everything except the new General Folder)...\n');
  const oldFolders = await FileRecord.findAll({ where: { isFolder: true } });
  let removed = 0;
  for (const folder of oldFolders) {
    if (folder.uuid === general.uuid) continue;
    await folder.destroy({ force: true });
    removed++;
  }
  console.log(`✅  Removed ${removed} old folder(s)\n`);

  await sequelize.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
