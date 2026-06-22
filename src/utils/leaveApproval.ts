import { Request } from 'express';
import { Staff } from '@models/Staff.model';
import { User } from '@models/User.model';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/**
 * HR and Admin can approve everyone else's leave, but approving a fellow
 * HR's or fellow Admin's leave is reserved for Super Admin only — this has
 * to check the literal role string rather than going through
 * AuthMiddleware.requirePermission's own admin/superadmin bypass, which
 * would otherwise let an Admin caller sail through unchecked.
 */
export function isSuperAdminOnly(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map(norm);
  return roles.includes('superadmin');
}

/**
 * Leave requests only carry staffId — the requester's role lives on
 * Staff.userId -> User -> roles, so it has to be looked up per-request
 * rather than assumed from the caller's own role.
 */
export async function requesterIsHrOrAdmin(staffId: bigint | number | undefined | null): Promise<boolean> {
  if (!staffId) return false;
  const staff = await Staff.findByPk(staffId, { attributes: ['userId'] });
  if (!staff || !(staff as any).userId) return false;
  const user = await User.findByPk((staff as any).userId);
  if (!user) return false;
  const roles = await (user as any).getRoles();
  const roleCodes = roles.map((r: any) => norm(r.code));
  return roleCodes.includes('hr') || roleCodes.includes('admin');
}
