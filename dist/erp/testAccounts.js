"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTestAccountEmail = exports.TEST_DOMAIN = void 0;
exports.testAccountsRouter = testAccountsRouter;
const express_1 = require("express");
const crypto_1 = require("crypto");
const sequelize_1 = require("sequelize");
const PasswordService_1 = __importDefault(require("../services/PasswordService"));
const helpers_1 = require("./helpers");
exports.TEST_DOMAIN = '@maxhub.test';
const isTestAccountEmail = (email) => String(email || '').toLowerCase().endsWith(exports.TEST_DOMAIN);
exports.isTestAccountEmail = isTestAccountEmail;
const ACCOUNTS = [
    { key: 'student', email: `test.student${exports.TEST_DOMAIN}`, firstName: 'Test', lastName: 'Student', role: 'student' },
    { key: 'accountant', email: `test.accountant${exports.TEST_DOMAIN}`, firstName: 'Test', lastName: 'Accountant', role: 'accountant' },
];
const q = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
const run = (sql, replacements = {}) => helpers_1.db.query(sql, { replacements });
function makePassword() {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const part = (n) => Array.from({ length: n }, () => A[(0, crypto_1.randomInt)(A.length)]).join('');
    return `Test-${part(4)}-${part(4)}-${(0, crypto_1.randomInt)(10, 99)}`;
}
async function status() {
    const rows = await q(`SELECT id, email, status, "lastLoginAt" FROM users WHERE email IN (:emails) AND "deletedAt" IS NULL`, { emails: ACCOUNTS.map((a) => a.email) })
        .catch(() => q(`SELECT id, email, status, NULL AS "lastLoginAt" FROM users WHERE email IN (:emails) AND "deletedAt" IS NULL`, { emails: ACCOUNTS.map((a) => a.email) }));
    return ACCOUNTS.map((a) => {
        const u = rows.find((r) => r.email === a.email);
        return { key: a.key, email: a.email, role: a.role, exists: !!u, active: u?.status === 'Active', lastLoginAt: u?.lastLoginAt || null };
    });
}
async function ensureAccount(a, password) {
    const hash = await PasswordService_1.default.hashPassword(password);
    let user = (await q(`SELECT id FROM users WHERE email = :email`, { email: a.email }))[0];
    if (user) {
        await run(`UPDATE users SET "passwordHash" = :hash, status = 'Active', "loginAttempts" = 0, "lockedUntil" = NULL, "mustChangePassword" = false,
               "emailVerified" = true, "deletedAt" = NULL, "updatedAt" = NOW() WHERE id = :id`, { hash, id: user.id });
    }
    else {
        await run(`INSERT INTO users (uuid, "firstName", "lastName", email, "passwordHash", "mustChangePassword", status, "emailVerified", "emailVerifiedAt", "loginAttempts", "createdAt", "updatedAt")
               VALUES (:uuid, :fn, :ln, :email, :hash, false, 'Active', true, NOW(), 0, NOW(), NOW())`, { uuid: (0, crypto_1.randomUUID)(), fn: a.firstName, ln: a.lastName, email: a.email, hash });
        user = (await q(`SELECT id FROM users WHERE email = :email`, { email: a.email }))[0];
    }
    const uid = Number(user.id);
    const role = (await q(`SELECT id FROM roles WHERE code = :code`, { code: a.role }))[0];
    if (!role)
        throw new Error(`The ${a.role} role is missing`);
    await run(`DELETE FROM user_roles WHERE "userId" = :uid AND "roleId" <> :rid`, { uid, rid: role.id });
    const has = (await q(`SELECT id FROM user_roles WHERE "userId" = :uid AND "roleId" = :rid`, { uid, rid: role.id }))[0];
    if (has)
        await run(`UPDATE user_roles SET "deletedAt" = NULL, "expiresAt" = NULL WHERE id = :id`, { id: has.id });
    else
        await run(`INSERT INTO user_roles (uuid, "userId", "roleId", "assignedAt", "createdAt", "updatedAt") VALUES (:uuid, :uid, :rid, NOW(), NOW(), NOW())`, { uuid: (0, crypto_1.randomUUID)(), uid, rid: role.id });
    if (a.key === 'student') {
        const sp = (await q(`SELECT id FROM student_profiles WHERE "userId" = :uid`, { uid }))[0];
        if (!sp) {
            const company = (await q(`SELECT id FROM companies ORDER BY (code = 'KS') DESC, id LIMIT 1`))[0];
            const dept = (await q(`SELECT id FROM departments WHERE code IN ('KS-TRN','KS') ORDER BY (code = 'KS-TRN') DESC LIMIT 1`).catch(() => []))[0];
            if (!company)
                throw new Error('No company found for the test student');
            await run(`INSERT INTO student_profiles (uuid, "userId", "companyId", "departmentId", "studentNumber", "enrollmentDate", status, notes, "createdAt", "updatedAt")
                 VALUES (:uuid, :uid, :cid, :did, 'TEST-STUDENT', NOW(), 'Active', 'Test account — safe to ignore in reports', NOW(), NOW())`, { uuid: (0, crypto_1.randomUUID)(), uid, cid: company.id, did: dept?.id || null });
        }
    }
    return uid;
}
function testAccountsRouter() {
    const r = (0, express_1.Router)();
    const guard = (req, res) => {
        if ((0, helpers_1.isSuper)(req))
            return true;
        res.status(403).json({ success: false, message: 'Only the Super Admin can manage test accounts' });
        return false;
    };
    r.get('/test-accounts', async (req, res) => {
        if (!guard(req, res))
            return;
        res.json({ success: true, data: await status() });
    });
    r.post('/test-accounts/reset', async (req, res) => {
        if (!guard(req, res))
            return;
        try {
            const only = req.body?.key ? ACCOUNTS.filter((a) => a.key === req.body.key) : ACCOUNTS;
            const out = [];
            for (const a of only) {
                const password = makePassword();
                await ensureAccount(a, password);
                out.push({ key: a.key, email: a.email, role: a.role, password });
            }
            await (0, helpers_1.audit)(req, 'Admin', 'Reset', 'TestAccount', null, `Test sign-ins created/reset: ${out.map((o) => o.key).join(', ')}`);
            res.json({ success: true, data: out, message: 'Test sign-ins ready' });
        }
        catch (e) {
            res.status(500).json({ success: false, message: e?.message || 'Could not create the test accounts' });
        }
    });
    r.post('/test-accounts/disable', async (req, res) => {
        if (!guard(req, res))
            return;
        await run(`UPDATE users SET status = 'Inactive', "updatedAt" = NOW() WHERE email IN (:emails)`, { emails: ACCOUNTS.map((a) => a.email) });
        await (0, helpers_1.audit)(req, 'Admin', 'Disable', 'TestAccount', null, 'Test sign-ins switched off');
        res.json({ success: true, data: await status(), message: 'Test sign-ins switched off' });
    });
    return r;
}
//# sourceMappingURL=testAccounts.js.map