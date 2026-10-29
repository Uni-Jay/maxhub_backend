import { Router } from 'express';
import { QueryTypes } from 'sequelize';
import { ErpModels } from './models';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, emitChange, isManagement, roleOf, toNum, userId, userName, notifyUsers } from './helpers';

/**
 * People features: per-staff pay, payslips with the employing brand's logo,
 * staff ↔ brand membership (everyone works for every brand, with a
 * per-brand head), and the branded welcome email.
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;

const canSeePay = (req: any) => isManagement(req) || ['hr', 'accountant'].includes(roleOf(req));

export function money(n: any, currency = 'NGN'): string {
  const v = Number(n) || 0;
  const sym: Record<string, string> = { NGN: '₦', USD: '$', GBP: '£', EUR: '€' };
  return `${sym[currency] || `${currency} `}${v.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Top-level brand departments (VisaMax, Kurios SAT, BeadMax, Maxfood Farm…). */
export async function brandDepartments(): Promise<Array<{ id: number; code: string; name: string; headUserId: number | null; displayName: string; logoUrl: string | null; primaryColor: string | null; tagline: string | null }>> {
  const rows = await q(
    `SELECT d.id, d.code, d.name, d."headUserId", COALESCE(bp."displayName", d.name) AS "displayName", bp."logoUrl", bp."primaryColor", bp.tagline
     FROM departments d LEFT JOIN erp_brand_profiles bp ON bp."departmentId" = d.id
     WHERE d."deletedAt" IS NULL AND d."parentDepartmentId" IS NULL AND COALESCE(d.status::text, 'Active') = 'Active'
     ORDER BY CASE UPPER(d.code) WHEN 'VM' THEN 1 WHEN 'KS' THEN 2 WHEN 'BM' THEN 3 WHEN 'MF' THEN 4 ELSE 5 END, d.name`,
  );
  return rows.map((r) => ({ ...r, id: Number(r.id), headUserId: r.headUserId ? Number(r.headUserId) : null }));
}

/** The brand (top-level department) a department belongs to. */
export async function brandOfDepartment(departmentId: any): Promise<number | null> {
  if (!departmentId) return null;
  const rows = await q(
    `WITH RECURSIVE up AS (SELECT id, "parentDepartmentId" FROM departments WHERE id = :d
       UNION ALL SELECT d.id, d."parentDepartmentId" FROM departments d JOIN up ON d.id = up."parentDepartmentId")
     SELECT id FROM up WHERE "parentDepartmentId" IS NULL LIMIT 1`,
    { d: Number(departmentId) },
  );
  return rows[0] ? Number(rows[0].id) : null;
}

/** Adds the staff member to every brand (as secondary) — never removes anything. */
export async function ensureStaffInAllBrands(staffId: number): Promise<void> {
  const staff = (await q(`SELECT id, "departmentId" FROM staff WHERE id = :id AND "deletedAt" IS NULL`, { id: staffId }))[0];
  if (!staff) return;
  const brands = await brandDepartments();
  const primaryBrand = await brandOfDepartment(staff.departmentId);
  for (const b of brands) {
    const isPrimary = Number(staff.departmentId) === b.id;
    await db.query(
      `INSERT INTO staff_departments ("staffId", "departmentId", "isPrimary", "assignedAt", "createdAt", "updatedAt")
       VALUES (:s, :d, :p, NOW(), NOW(), NOW()) ON CONFLICT ("staffId", "departmentId") DO NOTHING`,
      { replacements: { s: staffId, d: b.id, p: isPrimary } },
    ).catch(() => undefined);
  }
  // Their primary department itself (may be a sub-department such as KS-ICT).
  if (staff.departmentId && primaryBrand !== Number(staff.departmentId)) {
    await db.query(
      `INSERT INTO staff_departments ("staffId", "departmentId", "isPrimary", "assignedAt", "createdAt", "updatedAt")
       VALUES (:s, :d, true, NOW(), NOW(), NOW()) ON CONFLICT ("staffId", "departmentId") DO NOTHING`,
      { replacements: { s: staffId, d: staff.departmentId } },
    ).catch(() => undefined);
  }
}

export async function ensureAllStaffInAllBrands(): Promise<number> {
  const staff = await q(`SELECT id FROM staff WHERE "deletedAt" IS NULL AND COALESCE(status::text, 'Active') = 'Active'`);
  for (const s of staff) await ensureStaffInAllBrands(Number(s.id));
  return staff.length;
}

/** The staff member's brands: primary (employer) first, then the others. */
export async function staffBrands(staffId: number) {
  const staff = (await q(`SELECT id, "userId", "departmentId" FROM staff WHERE id = :id`, { id: staffId }))[0];
  if (!staff) return null;
  const brands = await brandDepartments();
  const primaryId = await brandOfDepartment(staff.departmentId);
  const links = new Set((await q(`SELECT "departmentId" FROM staff_departments WHERE "staffId" = :id`, { id: staffId })).map((r) => Number(r.departmentId)));
  const subLinks = await q(
    `SELECT d."parentDepartmentId" AS brand, d.id, d.name FROM staff_departments sd JOIN departments d ON d.id = sd."departmentId"
     WHERE sd."staffId" = :id AND d."parentDepartmentId" IS NOT NULL`, { id: staffId },
  );
  const list = brands
    .filter((b) => b.id === primaryId || links.has(b.id) || subLinks.some((s) => Number(s.brand) === b.id))
    .map((b) => ({
      departmentId: b.id, code: b.code, name: b.displayName, logoUrl: b.logoUrl, color: b.primaryColor,
      isPrimary: b.id === primaryId,
      isHead: !!staff.userId && b.headUserId === Number(staff.userId),
      units: subLinks.filter((s) => Number(s.brand) === b.id).map((s) => s.name),
    }));
  list.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return { staffId, userId: staff.userId ? Number(staff.userId) : null, primaryDepartmentId: staff.departmentId ? Number(staff.departmentId) : null, brands: list };
}

async function staffRecord(staffId: number) {
  return (await q(
    `SELECT s.id, s."userId", s."employeeId", s."firstName", s."lastName", s.email, s.phone, s.position, s."jobTitle", s."departmentId",
            s."bankName", s."accountName", s."accountNumber", s."joiningDate", s."hireDate", d.name AS "departmentName",
            ds.name AS "designationName", rm."firstName" AS "managerFirst", rm."lastName" AS "managerLast"
     FROM staff s LEFT JOIN departments d ON d.id = s."departmentId" LEFT JOIN designations ds ON ds.id = s."designationId"
     LEFT JOIN staff rm ON rm.id = s."reportingManagerId"
     WHERE s.id = :id`, { id: staffId },
  ))[0];
}

/**
 * Sends the branded welcome email. A temporary password is only included
 * when one is passed in (new staff, or an explicit password reset).
 */
export async function sendStaffWelcome(staffId: number, opts: { temporaryPassword?: string } = {}): Promise<boolean> {
  const s = await staffRecord(staffId);
  if (!s?.email) return false;
  const mem = await staffBrands(staffId);
  const primary = mem?.brands.find((b) => b.isPrimary) || mem?.brands[0];
  const pay: any = ErpModels.StaffPay ? await ErpModels.StaffPay.findByPk(staffId, { raw: true }) : null;
  const allowances = (pay?.allowances || []).reduce((t: number, a: any) => t + (Number(a?.amount) || 0), 0);
  const gross = pay ? Number(pay.basicSalary || 0) + allowances : 0;
  const { sendWelcomeEmail } = require('@services/email/hr-email.service');
  return sendWelcomeEmail({
    to: s.email,
    firstName: s.firstName,
    lastName: s.lastName,
    employeeId: s.employeeId || String(s.id),
    temporaryPassword: opts.temporaryPassword,
    position: s.position || s.jobTitle || s.designationName || undefined,
    department: s.departmentName || undefined,
    salary: gross ? `${money(gross, pay.currency || 'NGN')} per month` : undefined,
    startDate: s.joiningDate || s.hireDate ? new Date(s.joiningDate || s.hireDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined,
    brandName: primary?.name,
    brandLogoUrl: primary?.logoUrl || undefined,
    brandColor: primary?.color || undefined,
    otherBrands: (mem?.brands || []).filter((b) => !b.isPrimary).map((b) => b.name),
    reportsTo: s.managerFirst ? `${s.managerFirst} ${s.managerLast || ''}`.trim() : undefined,
  });
}

function cleanLines(v: any): Array<{ name: string; amount: number }> {
  if (!Array.isArray(v)) return [];
  return v.map((l: any) => ({ name: String(l?.name || '').trim().slice(0, 80), amount: Math.max(0, toNum(l?.amount)) }))
    .filter((l) => l.name && l.amount > 0).slice(0, 20);
}

export function peopleRouter(): Router {
  const r = Router();

  // ── Staff pay (pay per staff member — no salary structures) ─────────────
  r.get('/staff-pay', wrap(async (req, res) => {
    if (!canSeePay(req)) return fail(res, 403, 'Only HR, Accounts and management can see staff pay');
    const staff = await q(
      `SELECT s.id, s."employeeId", s."firstName", s."lastName", s.email, s.position, s."jobTitle", s."departmentId", d.name AS "departmentName",
              s."bankName", s."accountNumber", s.status
       FROM staff s LEFT JOIN departments d ON d.id = s."departmentId"
       WHERE s."deletedAt" IS NULL ORDER BY s."firstName", s."lastName"`,
    );
    const pays = new Map(((await ErpModels.StaffPay.findAll({ raw: true })) as any[]).map((p) => [String(p.staffId), p]));
    const brands = await brandDepartments();
    const brandName = new Map(brands.map((b) => [b.id, b.displayName]));
    const out = [];
    for (const s of staff) {
      const p: any = pays.get(String(s.id));
      const brandId = await brandOfDepartment(s.departmentId);
      const allowances = (p?.allowances || []).reduce((t: number, a: any) => t + (Number(a?.amount) || 0), 0);
      const deductions = (p?.deductions || []).reduce((t: number, a: any) => t + (Number(a?.amount) || 0), 0);
      const gross = p ? Number(p.basicSalary) + allowances : 0;
      out.push({
        ...s, brand: brandId ? brandName.get(brandId) : null,
        pay: p ? { ...p, basicSalary: Number(p.basicSalary), gross, totalDeductions: deductions, net: gross - deductions } : null,
      });
    }
    return ok(res, out);
  }));

  r.put('/staff-pay/:staffId', wrap(async (req, res) => {
    if (!canSeePay(req)) return fail(res, 403, 'Only HR, Accounts and management can set staff pay');
    const staffId = Number(req.params.staffId);
    const s = await staffRecord(staffId);
    if (!s) return fail(res, 404, 'Staff member not found');
    if (s.userId && Number(s.userId) === userId(req) && roleOf(req) !== 'superadmin') return fail(res, 403, 'You cannot set your own pay — ask another manager');
    const b = req.body || {};
    const row = {
      staffId,
      currency: String(b.currency || 'NGN').toUpperCase().slice(0, 3),
      basicSalary: Math.max(0, toNum(b.basicSalary)),
      allowances: cleanLines(b.allowances),
      deductions: cleanLines(b.deductions),
      paymentMethod: b.paymentMethod ? String(b.paymentMethod).slice(0, 40) : 'Bank transfer',
      effectiveFrom: b.effectiveFrom || null,
      notes: b.notes ? String(b.notes).slice(0, 2000) : null,
      updatedById: userId(req),
    };
    const before: any = await ErpModels.StaffPay.findByPk(staffId, { raw: true });
    await ErpModels.StaffPay.upsert(row as any);
    await audit(req, 'Payroll', before ? 'Update' : 'Create', 'StaffPay', staffId, `${userName(req)} set pay for ${s.firstName} ${s.lastName}: basic ${money(row.basicSalary, row.currency)}`, { before, after: row });
    emitChange(req, 'staff_pay', 'updated', { id: staffId });
    return ok(res, row, 'Pay saved');
  }));

  // ── Payslip (branded with the brand that employs the staff member) ──────
  r.get('/payslip/:salaryId', wrap(async (req, res) => {
    const sal = (await q(
      `SELECT es.*, pp."periodCode", pp.month, pp.year, pp."startDate", pp."endDate", pp.status AS "periodStatus"
       FROM employee_salaries es JOIN payroll_periods pp ON pp.id = es."payrollPeriodId"
       WHERE es.id = :id AND es."deletedAt" IS NULL`, { id: Number(req.params.salaryId) },
    ))[0];
    if (!sal) return fail(res, 404, 'Payslip not found');
    const s = await staffRecord(Number(sal.staffId));
    const mine = s?.userId && Number(s.userId) === userId(req);
    if (!mine && !canSeePay(req)) return fail(res, 403, 'You can only open your own payslip');
    const mem = await staffBrands(Number(sal.staffId));
    const breakdown: any = ErpModels.SalaryBreakdown ? await ErpModels.SalaryBreakdown.findByPk(sal.id, { raw: true }) : null;
    const earnings = breakdown?.earnings?.length ? breakdown.earnings : [
      { name: 'Basic salary', amount: Number(sal.baseSalary) },
      ...(Number(sal.bonus) ? [{ name: 'Allowances & bonus', amount: Number(sal.bonus) }] : []),
    ];
    const deductions = breakdown?.deductions?.length ? breakdown.deductions : [
      ['Income tax (PAYE)', sal.incomeTax], ['Pension', sal.providentFund], ['Health insurance', sal.healthInsurance],
      ['Salary advance', sal.advanceAmount], ['Other deductions', sal.otherDeductions],
    ].filter(([, v]) => Number(v)).map(([name, amount]) => ({ name, amount: Number(amount) }));
    const primary = mem?.brands.find((b) => b.isPrimary) || null;
    const profile = primary ? (await q(`SELECT * FROM erp_brand_profiles WHERE "departmentId" = :d`, { d: primary.departmentId }))[0] : null;
    return ok(res, {
      id: Number(sal.id), status: sal.status, periodCode: sal.periodCode, month: sal.month, year: sal.year,
      startDate: sal.startDate, endDate: sal.endDate, paidOn: sal.paidOn, processedOn: sal.processedOn,
      currency: breakdown?.currency || 'NGN',
      grossSalary: Number(sal.grossSalary), totalDeductions: Number(sal.totalDeductions), netSalary: Number(sal.netSalary),
      earnings, deductions, remarks: sal.remarks,
      staff: s && {
        id: Number(s.id), employeeId: s.employeeId, name: `${s.firstName} ${s.lastName}`, email: s.email,
        position: s.position || s.jobTitle || s.designationName, department: s.departmentName,
        bankName: s.bankName, accountName: s.accountName, accountNumber: sal.bankAccountNumber || s.accountNumber,
      },
      employer: profile ? {
        name: profile.displayName, logoUrl: profile.logoUrl, color: profile.primaryColor, secondaryColor: profile.secondaryColor,
        address: profile.address, email: profile.email, phone: profile.phone, website: profile.website, tagline: profile.tagline,
      } : { name: process.env.COMPANY_NAME || 'MaxHub', logoUrl: '/images/maxhublogo.jpeg', color: '#1e3a8a' },
      alsoWorksFor: (mem?.brands || []).filter((b) => !b.isPrimary).map((b) => ({ name: b.name, logoUrl: b.logoUrl })),
    });
  }));

  // ── Brands a staff member works for (everyone is in every brand) ─────────
  r.get('/staff/:staffId/brands', wrap(async (req, res) => {
    const data = await staffBrands(Number(req.params.staffId));
    if (!data) return fail(res, 404, 'Staff member not found');
    return ok(res, data);
  }));

  r.get('/my-brands', wrap(async (req, res) => {
    const s = (await q(`SELECT id FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: userId(req) }))[0];
    if (!s) return ok(res, { brands: [] });
    return ok(res, await staffBrands(Number(s.id)));
  }));

  /**
   * Body: { primaryDepartmentId?, memberOf: number[] (brand ids), headOf: number[] (brand ids) }
   * Primary = the brand that employed them. Head = HOD of that brand.
   */
  r.put('/staff/:staffId/brands', wrap(async (req, res) => {
    if (!isManagement(req) && roleOf(req) !== 'hr') return fail(res, 403, 'Only HR and management can change brand membership');
    const staffId = Number(req.params.staffId);
    const s = await staffRecord(staffId);
    if (!s) return fail(res, 404, 'Staff member not found');
    const brands = await brandDepartments();
    const brandIds = new Set(brands.map((b) => b.id));
    const b = req.body || {};
    const memberOf: number[] = (Array.isArray(b.memberOf) ? b.memberOf : brands.map((x) => x.id)).map(Number).filter((id: number) => brandIds.has(id));
    const headOf: number[] = (Array.isArray(b.headOf) ? b.headOf : []).map(Number).filter((id: number) => brandIds.has(id));
    const primary = b.primaryDepartmentId ? Number(b.primaryDepartmentId) : null;

    if (primary && primary !== Number(s.departmentId)) {
      const exists = (await q(`SELECT id FROM departments WHERE id = :d AND "deletedAt" IS NULL`, { d: primary }))[0];
      if (!exists) return fail(res, 400, 'Unknown department');
      await db.query(`UPDATE staff SET "departmentId" = :d, "updatedAt" = NOW() WHERE id = :s`, { replacements: { d: primary, s: staffId } });
      await db.query(`UPDATE staff_departments SET "isPrimary" = false WHERE "staffId" = :s`, { replacements: { s: staffId } });
    }
    const primaryBrand = await brandOfDepartment(primary || s.departmentId);
    const keep = new Set([...memberOf, ...headOf, ...(primaryBrand ? [primaryBrand] : [])]);
    for (const id of brandIds) {
      if (keep.has(id)) {
        await db.query(
          `INSERT INTO staff_departments ("staffId", "departmentId", "isPrimary", "assignedAt", "createdAt", "updatedAt")
           VALUES (:s, :d, :p, NOW(), NOW(), NOW())
           ON CONFLICT ("staffId", "departmentId") DO UPDATE SET "isPrimary" = EXCLUDED."isPrimary", "updatedAt" = NOW()`,
          { replacements: { s: staffId, d: id, p: id === Number(primary || s.departmentId) } },
        );
      } else {
        await db.query(`DELETE FROM staff_departments WHERE "staffId" = :s AND "departmentId" = :d`, { replacements: { s: staffId, d: id } });
      }
    }
    if (primary && primary !== primaryBrand) {
      await db.query(
        `INSERT INTO staff_departments ("staffId", "departmentId", "isPrimary", "assignedAt", "createdAt", "updatedAt")
         VALUES (:s, :d, true, NOW(), NOW(), NOW()) ON CONFLICT ("staffId", "departmentId") DO UPDATE SET "isPrimary" = true`,
        { replacements: { s: staffId, d: primary } },
      );
    }
    // Head of brand (HOD) — one head per brand.
    if (s.userId) {
      const uid = Number(s.userId);
      for (const br of brands) {
        const wantsHead = headOf.includes(br.id);
        if (wantsHead && br.headUserId !== uid) {
          await db.query(`UPDATE departments SET "headUserId" = :u, "updatedAt" = NOW() WHERE id = :d`, { replacements: { u: uid, d: br.id } });
        } else if (!wantsHead && br.headUserId === uid) {
          await db.query(`UPDATE departments SET "headUserId" = NULL, "updatedAt" = NOW() WHERE id = :d`, { replacements: { d: br.id } });
        }
      }
      // Heading a brand needs at least the HOD role (never lowers anyone).
      if (headOf.length) {
        const roles = (await q(`SELECT r.code FROM user_roles ur JOIN roles r ON r.id = ur."roleId" WHERE ur."userId" = :u AND ur."deletedAt" IS NULL`, { u: uid })).map((x) => String(x.code).toLowerCase());
        if (!roles.some((c) => ['superadmin', 'admin', 'hr', 'hod'].includes(c))) {
          await db.query(
            `INSERT INTO user_roles (uuid, "userId", "roleId", "assignedAt", "createdAt", "updatedAt")
             SELECT gen_random_uuid(), :u, id, NOW(), NOW(), NOW() FROM roles WHERE code = 'hod'
             ON CONFLICT ("userId", "roleId") DO UPDATE SET "deletedAt" = NULL`,
            { replacements: { u: uid } },
          );
        }
        const names = brands.filter((x) => headOf.includes(x.id)).map((x) => x.displayName).join(', ');
        await notifyUsers(req, [uid], { title: 'You are now Head of Department', message: `You now lead ${names} on MaxHub.`, type: 'System', actionUrl: '/dashboard' }, { excludeSelf: userId(req) });
      }
    }
    await audit(req, 'HR', 'Update', 'StaffBrands', staffId, `${userName(req)} updated brands for ${s.firstName} ${s.lastName}`, { primary, memberOf, headOf });
    emitChange(req, 'staff', 'updated', { id: staffId });
    return ok(res, await staffBrands(staffId), 'Brands updated');
  }));

  // ── Resend the welcome email ─────────────────────────────────────────────
  r.post('/staff/:staffId/resend-welcome', wrap(async (req, res) => {
    if (!isManagement(req) && roleOf(req) !== 'hr') return fail(res, 403, 'Only HR and management can send this');
    const staffId = Number(req.params.staffId);
    const s = await staffRecord(staffId);
    if (!s) return fail(res, 404, 'Staff member not found');
    let temporaryPassword: string | undefined;
    if (req.body?.resetPassword === true && s.userId) {
      const PasswordService = require('@services/PasswordService').default;
      temporaryPassword = PasswordService.generateRandomPassword(12);
      const hash = await PasswordService.hashPassword(temporaryPassword);
      const cols = new Set((await q(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`)).map((c) => c.column_name));
      const pwCol = cols.has('passwordHash') ? 'passwordHash' : cols.has('password_hash') ? 'password_hash' : 'password';
      const mustChange = cols.has('mustChangePassword') ? `, "mustChangePassword" = true` : '';
      await db.query(`UPDATE users SET "${pwCol}" = :h, "updatedAt" = NOW()${mustChange} WHERE id = :u`, { replacements: { h: hash, u: s.userId } });
      await audit(req, 'HR', 'Update', 'User', s.userId, `${userName(req)} issued a new temporary password for ${s.firstName} ${s.lastName}`);
    }
    const sent = await sendStaffWelcome(staffId, { temporaryPassword });
    await audit(req, 'HR', 'Email', 'Staff', staffId, `${userName(req)} sent the welcome email to ${s.email}`);
    if (!sent) return fail(res, 502, 'The mail server did not accept the email. Check the HR mailbox settings.');
    return ok(res, { sent, passwordReset: !!temporaryPassword }, `Welcome email sent to ${s.email}`);
  }));

  return r;
}
