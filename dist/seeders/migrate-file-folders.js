"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const FileRecord_model_1 = require("../models/FileRecord.model");
async function main() {
    const dbUrl = process.env.DATABASE_URL;
    const SSL_OPTIONS = { require: true, rejectUnauthorized: false };
    const sequelize = dbUrl
        ? new sequelize_1.Sequelize(dbUrl, {
            dialect: 'postgres',
            logging: false,
            pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
            dialectOptions: { ssl: SSL_OPTIONS },
        })
        : new sequelize_1.Sequelize({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            dialect: 'postgres',
            logging: false,
            pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
            dialectOptions: { ssl: SSL_OPTIONS },
        });
    await sequelize.authenticate();
    console.log('\n🔄  Adding file_records.folderType column...\n');
    FileRecord_model_1.FileRecord.initModel(sequelize);
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
    let general = await FileRecord_model_1.FileRecord.findOne({ where: { isFolder: true, folderType: 'General' } });
    if (!general) {
        general = await FileRecord_model_1.FileRecord.create({
            uuid: (0, uuid_1.v4)(), name: 'General Folder', isFolder: true, folderType: 'General', icon: '📁', size: 0,
        });
    }
    console.log(`✅  General Folder uuid: ${general.uuid}\n`);
    console.log('🔄  Re-parenting existing files into General Folder...\n');
    const [reparented] = await FileRecord_model_1.FileRecord.update({ folderId: general.uuid }, { where: { isFolder: false } });
    console.log(`✅  Re-parented ${reparented} file(s)\n`);
    console.log('🔄  Removing old folders (everything except the new General Folder)...\n');
    const oldFolders = await FileRecord_model_1.FileRecord.findAll({ where: { isFolder: true } });
    let removed = 0;
    for (const folder of oldFolders) {
        if (folder.uuid === general.uuid)
            continue;
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
//# sourceMappingURL=migrate-file-folders.js.map