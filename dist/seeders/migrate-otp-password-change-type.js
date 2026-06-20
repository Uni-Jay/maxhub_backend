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
async function main() {
    const dbUrl = process.env.DATABASE_URL;
    const SSL_OPTIONS = { require: true, rejectUnauthorized: false };
    const sequelize = new sequelize_1.Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        pool: { max: 2, min: 0, acquire: 60000, idle: 10000 },
        dialectOptions: { ssl: SSL_OPTIONS },
    });
    await sequelize.authenticate();
    const [enums] = await sequelize.query(`
    SELECT t.typname FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_attribute a ON a.atttypid = t.oid
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'otp_verifications' AND a.attname = 'type'
    GROUP BY t.typname
  `);
    const typeName = enums[0]?.typname;
    if (!typeName) {
        console.error('\n❌  Could not find the enum type backing otp_verifications.type\n');
        process.exit(1);
    }
    const [existingValues] = await sequelize.query(`SELECT enumlabel FROM pg_enum WHERE enumtypid = '${typeName}'::regtype`);
    if (existingValues.some((r) => r.enumlabel === 'PASSWORD_CHANGE')) {
        console.log('\nℹ️  PASSWORD_CHANGE already exists — nothing to do.\n');
    }
    else {
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
//# sourceMappingURL=migrate-otp-password-change-type.js.map