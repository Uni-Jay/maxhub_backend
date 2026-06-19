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
const Role_model_1 = require("../models/Role.model");
const Permission_model_1 = require("../models/Permission.model");
const RolePermission_model_1 = require("../models/RolePermission.model");
const RolesConfig_1 = require("../config/RolesConfig");
const PermissionCodes_1 = require("../config/PermissionCodes");
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
    Role_model_1.Role.initModel(sequelize);
    Permission_model_1.Permission.initModel(sequelize);
    RolePermission_model_1.RolePermission.initModel(sequelize);
    console.log('🔐  Ensuring all PermissionCode values exist as Permission rows...\n');
    const parsePermissionCode = (code) => {
        const parts = code.split('.');
        const scope = parts[parts.length - 1];
        const action = parts[parts.length - 2];
        const module = parts[0];
        const resource = parts.slice(1, parts.length - 2).join('.');
        return { module, resource, action, scope };
    };
    const toTitleCase = (str) => str.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const makePermissionName = (code) => {
        const { module, resource, action, scope } = parsePermissionCode(code);
        const scopeLabel = scope === 'own_department' ? 'Own Dept' : scope === 'own_warehouse' ? 'Own Warehouse' : scope === 'own' ? 'Own' : 'All';
        return `${toTitleCase(module)} › ${toTitleCase(resource)} › ${toTitleCase(action)} [${scopeLabel}]`;
    };
    const allCodes = Object.values(PermissionCodes_1.PermissionCode);
    const permRows = allCodes.map((code) => {
        const { module, resource, action, scope } = parsePermissionCode(code);
        return { code, name: makePermissionName(code), description: `${toTitleCase(action)} ${toTitleCase(resource)} (${scope})`, module, resource, action, scope, isActive: true };
    });
    await Permission_model_1.Permission.bulkCreate(permRows, { ignoreDuplicates: true });
    console.log(`✅  Permissions table has all ${allCodes.length} current codes\n`);
    const roles = await Role_model_1.Role.findAll();
    const roleIdByCode = new Map(roles.map((r) => [r.code, r.id]));
    const permissions = await Permission_model_1.Permission.findAll();
    const permIdByCode = new Map(permissions.map((p) => [p.code, p.id]));
    let totalInserted = 0;
    let totalRemoved = 0;
    for (const [roleCode, desiredCodes] of Object.entries(RolesConfig_1.ROLE_PERMISSIONS)) {
        const roleId = roleIdByCode.get(roleCode);
        if (!roleId) {
            console.warn(`⚠️  Role not found in DB: ${roleCode}`);
            continue;
        }
        const desiredPermIds = new Set();
        for (const code of desiredCodes) {
            const permId = permIdByCode.get(code);
            if (!permId) {
                console.warn(`⚠️  Permission not found in DB: ${code} (role ${roleCode})`);
                continue;
            }
            desiredPermIds.add(permId);
        }
        const existing = await RolePermission_model_1.RolePermission.findAll({ where: { roleId }, attributes: ['id', 'permissionId'] });
        const existingPermIds = new Set(existing.map((rp) => rp.permissionId));
        const toInsert = [...desiredPermIds].filter((id) => !existingPermIds.has(id));
        const toRemove = existing.filter((rp) => !desiredPermIds.has(rp.permissionId));
        if (toInsert.length) {
            await RolePermission_model_1.RolePermission.bulkCreate(toInsert.map((permissionId) => ({ roleId, permissionId })), { ignoreDuplicates: true });
            totalInserted += toInsert.length;
        }
        if (toRemove.length) {
            await RolePermission_model_1.RolePermission.destroy({ where: { id: { [sequelize_1.Op.in]: toRemove.map((rp) => rp.id) } }, force: true });
            totalRemoved += toRemove.length;
        }
        console.log(`   ${roleCode}: +${toInsert.length} -${toRemove.length} (now ${desiredPermIds.size} permissions)`);
    }
    console.log(`\n✅  Reconciled. Inserted ${totalInserted}, removed ${totalRemoved} role-permission rows.\n`);
    await sequelize.close();
    process.exit(0);
}
main().catch((err) => {
    console.error('\n❌  Sync failed:', err);
    process.exit(1);
});
//# sourceMappingURL=sync-role-permissions.js.map