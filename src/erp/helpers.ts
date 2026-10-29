import { Request } from 'express';
import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import sequelize from '@config/Database';
import { getRoleBucket, RoleBucket } from '@utils/RoleBucket';

export const db = sequelize;

export function roleOf(req: Request): RoleBucket {
  return getRoleBucket(req);
}

export function isSuper(req: Request): boolean {
  return roleOf(req) === 'superadmin';
}

/** Super Admin + Admin (Manager, Directors, Head Admin, Head HR) see everything. */
export function isManagement(req: Request): boolean {
  const r = roleOf(req);
  return r === 'superadmin' || r === 'admin';
}

export function userId(req: Request): number {
  return Number((req as any).user?.id);
}

export function userName(req: Request): string {
  const u = (req as any).user || {};
  return u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Staff';
}

/** Department ids the caller heads (Department.headUserId) — used for HOD scope. */
export async function headedDepartmentIds(uid: number): Promise<number[]> {
  const rows: any[] = await db.query(
    `SELECT id, "parentDepartmentId" FROM departments WHERE "deletedAt" IS NULL AND "headUserId" = :uid`,
    { replacements: { uid }, type: QueryTypes.SELECT },
  );
  const ids = new Set<number>(rows.map((r) => Number(r.id)));
  // Heading a brand also covers its sub-departments.
  if (ids.size) {
    const kids: any[] = await db.query(
      `SELECT id FROM departments WHERE "deletedAt" IS NULL AND "parentDepartmentId" IN (:ids)`,
      { replacements: { ids: [...ids] }, type: QueryTypes.SELECT },
    );
    kids.forEach((k) => ids.add(Number(k.id)));
  }
  return [...ids];
}

/** Every department id the caller belongs to (primary + StaffDepartment links), plus children. */
export async function memberDepartmentIds(uid: number): Promise<number[]> {
  const rows: any[] = await db.query(
    `SELECT s."departmentId" AS id FROM staff s WHERE s."userId" = :uid AND s."deletedAt" IS NULL AND s."departmentId" IS NOT NULL
     UNION SELECT sd."departmentId" FROM staff_departments sd JOIN staff s ON s.id = sd."staffId" WHERE s."userId" = :uid`,
    { replacements: { uid }, type: QueryTypes.SELECT },
  );
  const ids = new Set<number>(rows.map((r) => Number(r.id)).filter(Boolean));
  if (ids.size) {
    const kids: any[] = await db.query(
      `SELECT id FROM departments WHERE "deletedAt" IS NULL AND "parentDepartmentId" IN (:ids)`,
      { replacements: { ids: [...ids] }, type: QueryTypes.SELECT },
    );
    kids.forEach((k) => ids.add(Number(k.id)));
  }
  return [...ids];
}

/** Resolves a brand code (VM, KS-ICT…) or numeric id to a department id. */
export async function resolveDepartmentId(v: any): Promise<number | null> {
  if (v === undefined || v === null || v === '') return null;
  if (/^\d+$/.test(String(v))) return Number(v);
  const rows: any[] = await db.query(
    `SELECT id FROM departments WHERE UPPER(code) = UPPER(:c) AND "deletedAt" IS NULL LIMIT 1`,
    { replacements: { c: String(v) }, type: QueryTypes.SELECT },
  );
  return rows[0] ? Number(rows[0].id) : null;
}

/** Department id plus all its sub-departments (brand → its divisions). */
export async function departmentFamily(id: number): Promise<number[]> {
  const rows: any[] = await db.query(
    `SELECT id FROM departments WHERE "deletedAt" IS NULL AND (id = :id OR "parentDepartmentId" = :id)`,
    { replacements: { id }, type: QueryTypes.SELECT },
  );
  return rows.map((r) => Number(r.id));
}

export async function staffUserId(staffId: any): Promise<number | null> {
  if (!staffId) return null;
  const rows: any[] = await db.query(`SELECT "userId" FROM staff WHERE id = :id`, {
    replacements: { id: staffId }, type: QueryTypes.SELECT,
  });
  return rows[0]?.userId ? Number(rows[0].userId) : null;
}

/**
 * Sequential, human-readable codes per prefix and year, e.g. VMX-RCT-2026-0007.
 * Uses a row-locked counter in erp_settings so concurrent requests never collide.
 */
export async function nextCode(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const key = `counter:${prefix}:${year}`;
  return db.transaction(async (t) => {
    await db.query(
      `INSERT INTO erp_settings (key, value, "createdAt", "updatedAt") VALUES (:k, '0'::jsonb, NOW(), NOW())
       ON CONFLICT (key) DO NOTHING`,
      { replacements: { k: key }, transaction: t },
    );
    const rows: any[] = await db.query(
      `UPDATE erp_settings SET value = to_jsonb((value::text)::int + 1), "updatedAt" = NOW()
       WHERE key = :k RETURNING value`,
      { replacements: { k: key }, type: QueryTypes.SELECT, transaction: t },
    );
    const n = Number(rows[0]?.value ?? 1);
    return `${prefix}-${year}-${String(n).padStart(4, '0')}`;
  });
}

export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export function sha256(s: string): string {
  return crypto.createHash('sha256').update(s || '').digest('hex');
}

/** Pushes a live "something changed" event so open screens refresh instantly. */
export function emitChange(req: Request | null, entity: string, action: string, data?: any): void {
  try {
    const io = (req as any)?.app?.get?.('io') || (global as any).__maxhubIO;
    if (io) io.emit('erp:changed', { entity, action, id: data?.id ?? null, at: new Date().toISOString() });
  } catch { /* non-fatal */ }
}

/** Writes to the existing audit_logs table — never throws. */
export async function audit(req: Request, module: string, action: string, entity: string, entityId: any, description: string, changes?: any) {
  if (req) (req as any).__audited = true;
  try {
    await db.query(
      `INSERT INTO audit_logs (uuid, module, action, entity, "entityId", description, changes, "userId", "ipAddress", "userAgent", status, "createdAt")
       VALUES (gen_random_uuid(), :module, :action, :entity, :entityId, :description, :changes, :userId, :ip, :ua, 'Success', NOW())`,
      {
        replacements: {
          module, action, entity, entityId: Number(entityId) || 0, description,
          changes: changes ? JSON.stringify(changes).slice(0, 20000) : null,
          userId: userId(req) || 0, ip: require('./auditTrail').clientIp(req), ua: req.get('user-agent') || null,
        },
      },
    );
  } catch { /* audit table shape differs on some deployments — ignore */ }
}

/** Users holding any of the given role codes (superadmin/admin/hr/hod/staff). */
export async function userIdsWithRoles(roles: string[]): Promise<number[]> {
  const rows: any[] = await db.query(
    `SELECT DISTINCT ur."userId" FROM user_roles ur JOIN roles r ON r.id = ur."roleId"
     JOIN users u ON u.id = ur."userId"
     WHERE ur."deletedAt" IS NULL AND u."deletedAt" IS NULL AND LOWER(REGEXP_REPLACE(r.code, '[^a-zA-Z]', '', 'g')) IN (:roles)`,
    { replacements: { roles: roles.map((r) => r.toLowerCase()) }, type: QueryTypes.SELECT },
  );
  return rows.map((r) => Number(r.userId));
}

export async function departmentHeadUserIds(departmentId: number | null | undefined): Promise<number[]> {
  if (!departmentId) return [];
  const rows: any[] = await db.query(
    `SELECT "headUserId" FROM departments WHERE "headUserId" IS NOT NULL AND (id = :id OR id = (SELECT "parentDepartmentId" FROM departments WHERE id = :id))`,
    { replacements: { id: departmentId }, type: QueryTypes.SELECT },
  );
  return rows.map((r) => Number(r.headUserId));
}

/** Creates in-app notifications and pushes them live to the recipients' open sockets. */
export async function notifyUsers(
  req: Request | null,
  userIds: number[],
  n: { title: string; message: string; type?: string; actionUrl?: string; priority?: string; entityType?: string; entityId?: any },
  opts: { excludeSelf?: number } = {},
) {
  const { notifyUser } = require('@utils/notify');
  const io = (req as any)?.app?.get?.('io') || (global as any).__maxhubIO;
  const unique = [...new Set(userIds.filter((u) => u && u !== opts.excludeSelf))];
  // The notifications table only knows these types; map friendly names onto them.
  const VALID = ['Message', 'Mention', 'Assignment', 'Leave', 'Payroll', 'System', 'Alert', 'Other'];
  const MAP: Record<string, string> = { Approval: 'Assignment', Task: 'Assignment', Reminder: 'Alert', Announcement: 'Alert', Meeting: 'Alert', Birthday: 'Other' };
  const type = VALID.includes(String(n.type)) ? n.type : MAP[String(n.type)] || 'System';
  for (const uid of unique) {
    try {
      await notifyUser(uid, {
        type: type as any, title: n.title, message: n.message, actionUrl: n.actionUrl,
        priority: (n.priority as any) || 'Medium', relatedEntityType: n.entityType, relatedEntityId: n.entityId,
      }, io);
    } catch { /* keep going */ }
  }
}

export function toNum(v: any, d = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function publicAppUrl(): string {
  return (process.env.FRONTEND_URL || process.env.APP_URL || 'https://www.maxhubng.company').replace(/\/$/, '');
}
