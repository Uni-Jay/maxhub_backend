import { Router, Request, Response } from 'express';
import { randomUUID, randomInt } from 'crypto';
import { QueryTypes } from 'sequelize';
import PasswordService from '@services/PasswordService';
import { audit, db, isSuper } from './helpers';

/**
 * Test sign-ins for trying MaxHub as a student or an accountant.
 *
 * They use the reserved ".test" email domain, which can never receive email,
 * so nothing is sent anywhere and sign-in skips the emailed code. Only the
 * Super Admin can create, reset or switch them off; real accounts are never touched.
 */
export const TEST_DOMAIN = '@maxhub.test';
export const isTestAccountEmail = (email: string) => String(email || '').toLowerCase().endsWith(TEST_DOMAIN);

const ACCOUNTS = [
  { key: 'student', email: `test.student${TEST_DOMAIN}`, firstName: 'Test', lastName: 'Student', role: 'student' },
  { key: 'accountant', email: `test.accountant${TEST_DOMAIN}`, firstName: 'Test', lastName: 'Accountant', role: 'accountant' },
] as const;

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
const run = (sql: string, replacements: any = {}) => db.query(sql, { replacements });

function makePassword(): string {
  // Easy to type, still strong: e.g. "Test-7Kq4-Zp9m-2Wx"
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const part = (n: number) => Array.from({ length: n }, () => A[randomInt(A.length)]).join('');
  return `Test-${part(4)}-${part(4)}-${randomInt(10, 99)}`;
}

async function status() {
  const rows = await q(`SELECT id, email, status, "lastLoginAt" FROM users WHERE email IN (:emails) AND "deletedAt" IS NULL`, { emails: ACCOUNTS.map((a) => a.email) })
    .catch(() => q(`SELECT id, email, status, NULL AS "lastLoginAt" FROM users WHERE email IN (:emails) AND "deletedAt" IS NULL`, { emails: ACCOUNTS.map((a) => a.email) }));
  return ACCOUNTS.map((a) => {
    const u = rows.find((r) => r.email === a.email);
    return { key: a.key, email: a.email, role: a.role, exists: !!u, active: u?.status === 'Active', lastLoginAt: u?.lastLoginAt || null };
  });
}

async function ensureAccount(a: typeof ACCOUNTS[number], password: string): Promise<number> {
  const hash = await PasswordService.hashPassword(password);
  let user = (await q(`SELECT id FROM users WHERE email = :email`, { email: a.email }))[0];
  if (user) {
    await run(`UPDATE users SET "passwordHash" = :hash, status = 'Active', "loginAttempts" = 0, "lockedUntil" = NULL, "mustChangePassword" = false,
               "emailVerified" = true, "deletedAt" = NULL, "updatedAt" = NOW() WHERE id = :id`, { hash, id: user.id });
  } else {
    await run(`INSERT INTO users (uuid, "firstName", "lastName", email, "passwordHash", "mustChangePassword", status, "emailVerified", "emailVerifiedAt", "loginAttempts", "createdAt", "updatedAt")
               VALUES (:uuid, :fn, :ln, :email, :hash, false, 'Active', true, NOW(), 0, NOW(), NOW())`,
      { uuid: randomUUID(), fn: a.firstName, ln: a.lastName, email: a.email, hash });
    user = (await q(`SELECT id FROM users WHERE email = :email`, { email: a.email }))[0];
  }
  const uid = Number(user.id);

  // Exactly one role: the one being tested.
  const role = (await q(`SELECT id FROM roles WHERE code = :code`, { code: a.role }))[0];
  if (!role) throw new Error(`The ${a.role} role is missing`);
  await run(`DELETE FROM user_roles WHERE "userId" = :uid AND "roleId" <> :rid`, { uid, rid: role.id });
  const has = (await q(`SELECT id FROM user_roles WHERE "userId" = :uid AND "roleId" = :rid`, { uid, rid: role.id }))[0];
  if (has) await run(`UPDATE user_roles SET "deletedAt" = NULL, "expiresAt" = NULL WHERE id = :id`, { id: has.id });
  else await run(`INSERT INTO user_roles (uuid, "userId", "roleId", "assignedAt", "createdAt", "updatedAt") VALUES (:uuid, :uid, :rid, NOW(), NOW(), NOW())`, { uuid: randomUUID(), uid, rid: role.id });

  // The student needs a student record so the portal has something to show.
  if (a.key === 'student') {
    const sp = (await q(`SELECT id FROM student_profiles WHERE "userId" = :uid`, { uid }))[0];
    if (!sp) {
      const company = (await q(`SELECT id FROM companies ORDER BY (code = 'KS') DESC, id LIMIT 1`))[0];
      const dept = (await q(`SELECT id FROM departments WHERE code IN ('KS-TRN','KS') ORDER BY (code = 'KS-TRN') DESC LIMIT 1`).catch(() => []))[0];
      if (!company) throw new Error('No company found for the test student');
      await run(`INSERT INTO student_profiles (uuid, "userId", "companyId", "departmentId", "studentNumber", "enrollmentDate", status, notes, "createdAt", "updatedAt")
                 VALUES (:uuid, :uid, :cid, :did, 'TEST-STUDENT', NOW(), 'Active', 'Test account — safe to ignore in reports', NOW(), NOW())`,
        { uuid: randomUUID(), uid, cid: company.id, did: dept?.id || null });
    }
  }
  return uid;
}

export function testAccountsRouter(): Router {
  const r = Router();
  const guard = (req: Request, res: Response) => {
    if (isSuper(req)) return true;
    res.status(403).json({ success: false, message: 'Only the Super Admin can manage test accounts' });
    return false;
  };

  r.get('/test-accounts', async (req, res) => {
    if (!guard(req, res)) return;
    res.json({ success: true, data: await status() });
  });

  // Creates the accounts if needed and gives each a fresh password (shown once).
  r.post('/test-accounts/reset', async (req, res) => {
    if (!guard(req, res)) return;
    try {
      const only = req.body?.key ? ACCOUNTS.filter((a) => a.key === req.body.key) : ACCOUNTS;
      const out: any[] = [];
      for (const a of only) {
        const password = makePassword();
        await ensureAccount(a, password);
        out.push({ key: a.key, email: a.email, role: a.role, password });
      }
      await audit(req, 'Admin', 'Reset', 'TestAccount', null, `Test sign-ins created/reset: ${out.map((o) => o.key).join(', ')}`);
      res.json({ success: true, data: out, message: 'Test sign-ins ready' });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e?.message || 'Could not create the test accounts' });
    }
  });

  // Switches the test sign-ins off (they can be turned back on with reset).
  r.post('/test-accounts/disable', async (req, res) => {
    if (!guard(req, res)) return;
    await run(`UPDATE users SET status = 'Inactive', "updatedAt" = NOW() WHERE email IN (:emails)`, { emails: ACCOUNTS.map((a) => a.email) });
    await audit(req, 'Admin', 'Disable', 'TestAccount', null, 'Test sign-ins switched off');
    res.json({ success: true, data: await status(), message: 'Test sign-ins switched off' });
  });

  return r;
}
