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
exports.fixtures = fixtures;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const app_1 = require("../app");
async function main() {
    if (!/127\.0\.0\.1|localhost/.test(process.env.DATABASE_URL || ''))
        throw new Error('local DB only');
    const app = new app_1.AppBootstrapper();
    app.initModels();
    app.initAssociations();
    const seq = app.sequelize;
    let ok = 0, bad = 0;
    for (const name of Object.keys(seq.models)) {
        try {
            await seq.models[name].sync();
            ok++;
        }
        catch (e) {
            try {
                const m = seq.models[name];
                m.options.indexes = [];
                m._indexes = [];
                await m.sync();
                ok++;
            }
            catch (e2) {
                bad++;
                console.log('skip', name, e2.message.slice(0, 120));
            }
        }
    }
    console.log({ ok, bad });
    await seq.close();
}
if (process.env.LOCAL_FIXTURES !== "1")
    main();
async function fixtures(seq) {
    const { PermissionCode } = require('../config/PermissionCodes');
    const { ROLE_PERMISSIONS } = require('../config/RolesConfig');
    const bcrypt = require('bcryptjs');
    const M = seq.models;
    const perms = {};
    for (const code of Object.values(PermissionCode)) {
        const [module, resource, action, scope] = code.split('.');
        const [p] = await M.Permission.findOrCreate({ where: { code }, defaults: { code, name: code, module: module || 'x', resource: resource || 'x', action: action || 'x', scope: scope || 'all', isActive: true } });
        perms[code] = p;
    }
    const roles = {};
    for (const code of Object.keys(ROLE_PERMISSIONS)) {
        const [r] = await M.Role.findOrCreate({ where: { code }, defaults: { code, name: code, isSystemRole: true, isActive: true } });
        roles[code] = r;
        for (const pc of ROLE_PERMISSIONS[code])
            if (perms[pc])
                await M.RolePermission.findOrCreate({ where: { roleId: r.id, permissionId: perms[pc].id } });
    }
    for (const d of [{ code: 'KS', name: 'Kurios Sat' }, { code: 'VM', name: 'Visamax Travels' }, { code: 'BM', name: 'Beadmax Design' }])
        await M.Department.findOrCreate({ where: { code: d.code }, defaults: { ...d, status: 'Active' } });
    const hash = await bcrypt.hash('Test@12345', 10);
    const people = [
        ['ceo@local.test', 'Chief', 'Exec', 'superadmin', 'CEO'],
        ['manager@local.test', 'Mana', 'Ger', 'admin', 'Manager'],
        ['hod@local.test', 'Head', 'Dept', 'hod', 'HOD'],
        ['staff@local.test', 'Reg', 'Staff', 'staff', 'Staff'],
    ];
    let n = 1;
    for (const [email, firstName, lastName, role, position] of people) {
        const [u] = await M.User.findOrCreate({ where: { email }, defaults: { email, firstName, lastName, passwordHash: hash, status: 'Active', emailVerified: true, mustChangePassword: false } });
        await M.UserRole.findOrCreate({ where: { userId: u.id, roleId: roles[role].id }, defaults: { assignedAt: new Date() } });
        await M.Staff.findOrCreate({ where: { userId: u.id }, defaults: { userId: u.id, employeeId: `EMP-T${n++}`, firstName, lastName, email, phone: '08000000000', position, status: 'Active', departmentId: 2, dateOfBirth: '1990-01-01', joiningDate: '2024-01-01' } });
    }
    console.log('fixtures ok');
}
if (process.env.LOCAL_FIXTURES === '1') {
    (async () => {
        const app = new app_1.AppBootstrapper();
        app.initModels();
        app.initAssociations();
        await fixtures(app.sequelize);
        await app.sequelize.close();
    })().catch((e) => { console.error(e); process.exit(1); });
}
//# sourceMappingURL=local-test-sync.js.map