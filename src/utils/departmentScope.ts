import { Request } from 'express';
import { Staff } from '@models/Staff.model';
import { StaffDepartment } from '@models/StaffDepartment.model';

/**
 * A staff member can cover multiple departments/business units (primary +
 * secondary via StaffDepartment) — e.g. one HOD covering Kurios SAT, VisaMax,
 * and BeadMax. Resolves the full set of department IDs the given user is
 * linked to, for features (invoices, proposals, student management) that
 * should scope to "every department I cover" rather than just my primary
 * department.
 */
export async function getUserDepartmentIds(userId: number): Promise<number[]> {
  const staff = await Staff.findOne({ where: { userId }, attributes: ['id', 'departmentId'] });
  if (!staff) return [];

  const ids = new Set<number>();
  const primaryDeptId = (staff as any).departmentId;
  if (primaryDeptId) ids.add(Number(primaryDeptId));

  const links = await StaffDepartment.findAll({ where: { staffId: staff.id }, attributes: ['departmentId'] });
  links.forEach((l: any) => ids.add(Number(l.departmentId)));

  return [...ids];
}

/**
 * Same bypass logic as the single-department scoping helpers used across
 * LMS/fee-receipt routes (superadmin/admin/headofadmin roles and holders of
 * the *_ALL permission are never scoped), but resolves to the caller's full
 * multi-department set instead of a single primary department.
 */
export async function getMultiDeptScope(
  req: Request,
  allPermission: string
): Promise<{ scoped: boolean; departmentIds: number[] }> {
  const user = (req as any).user;
  const normRoles = (user.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  if (normRoles.includes('superadmin') || normRoles.includes('admin') || normRoles.includes('headofadmin')) {
    return { scoped: false, departmentIds: [] };
  }
  const perms = new Set((user.permissions || []).map((p: string) => p.toLowerCase()));
  if (perms.has(allPermission.toLowerCase())) {
    return { scoped: false, departmentIds: [] };
  }
  const departmentIds = await getUserDepartmentIds(user.id);
  return { scoped: true, departmentIds };
}
