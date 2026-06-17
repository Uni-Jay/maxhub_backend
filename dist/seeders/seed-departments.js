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
const Department_model_1 = require("../models/Department.model");
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
    Department_model_1.Department.initModel(sequelize);
    const departments = [
        { code: 'KS', name: 'Kurios Sat', description: 'Kurios Sat business unit' },
        { code: 'VM', name: 'Visamax Travels', description: 'Visamax Travels business unit' },
        { code: 'BM', name: 'Beadmax Design', description: 'Beadmax Design business unit' },
    ];
    console.log('\n🏢  Seeding business unit departments...\n');
    for (const dept of departments) {
        const [row, created] = await Department_model_1.Department.findOrCreate({
            where: { code: dept.code },
            defaults: { ...dept, status: 'Active' },
        });
        console.log(`   ${created ? '✨ Created' : '⏭️  Exists '} → ${dept.name} (${dept.code}) — id: ${row.id}`);
    }
    console.log('\n✅  Done.\n');
    await sequelize.close();
    process.exit(0);
}
main().catch((err) => {
    console.error('\n❌  Seeder failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-departments.js.map