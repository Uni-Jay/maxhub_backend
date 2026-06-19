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
const Staff_model_1 = require("../models/Staff.model");
const User_model_1 = require("../models/User.model");
const Role_model_1 = require("../models/Role.model");
const UserRole_model_1 = require("../models/UserRole.model");
const PositionRoleMap_1 = require("../config/PositionRoleMap");
const CANONICAL_CODES = ['superadmin', 'admin', 'hr', 'hod', 'staff'];
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
    Staff_model_1.Staff.initModel(sequelize);
    User_model_1.User.initModel(sequelize);
    Role_model_1.Role.initModel(sequelize);
    UserRole_model_1.UserRole.initModel(sequelize);
    const roles = await Role_model_1.Role.findAll();
    const roleByCode = new Map(roles.map((r) => [r.code, r]));
    const allStaff = await Staff_model_1.Staff.findAll({ attributes: ['id', 'userId', 'position', 'firstName', 'lastName'] });
    console.log(`Checking ${allStaff.length} staff record(s)...\n`);
    let changed = 0;
    for (const s of allStaff) {
        const targetCode = s.position ? (PositionRoleMap_1.POSITION_ROLE_MAP[String(s.position).trim().toLowerCase()] ?? 'staff') : 'staff';
        const userRoles = await UserRole_model_1.UserRole.findAll({ where: { userId: s.userId } });
        const userRoleCodes = userRoles
            .map((ur) => roles.find((r) => String(r.id) === String(ur.roleId))?.code)
            .filter(Boolean);
        if (userRoleCodes.includes('superadmin'))
            continue;
        if (userRoleCodes.includes(targetCode))
            continue;
        const targetRole = roleByCode.get(targetCode);
        if (!targetRole) {
            console.warn(`  ⚠️  Role code not found in DB: ${targetCode} (staff ${s.firstName} ${s.lastName})`);
            continue;
        }
        const toRemove = userRoles.filter((ur) => {
            const code = roles.find((r) => String(r.id) === String(ur.roleId))?.code;
            return code && CANONICAL_CODES.includes(code);
        });
        for (const ur of toRemove)
            await ur.destroy();
        await UserRole_model_1.UserRole.create({ userId: s.userId, roleId: targetRole.id });
        console.log(`  ✓ ${s.firstName} ${s.lastName} (${s.position || 'no position'}): -> ${targetCode}`);
        changed++;
    }
    console.log(`\n✅  Done. ${changed} staff member(s) had their role corrected.\n`);
    await sequelize.close();
    process.exit(0);
}
main().catch((err) => {
    console.error('\n❌  Sync failed:', err);
    process.exit(1);
});
//# sourceMappingURL=sync-position-roles.js.map