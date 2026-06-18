import { Request } from 'express';

export type RoleBucket = 'superadmin' | 'admin' | 'hr' | 'hod' | 'staff';

function normaliseRole(r: string): string {
  return r.toLowerCase().replace(/[^a-z]/g, '');
}

/**
 * Coarse role bucket used to pick which data scope to apply — first matching
 * role wins. Mirrors the canonical 5-role structure (superadmin/admin/hr/hod/staff);
 * 'headofadmin' (legacy JWT role string) normalises into the 'admin' bucket.
 */
export function getRoleBucket(req: Request): RoleBucket {
  const roles = (req.user?.roles ?? []).map(normaliseRole);
  if (roles.includes('superadmin')) return 'superadmin';
  if (roles.includes('admin') || roles.includes('headofadmin')) return 'admin';
  if (roles.includes('hr')) return 'hr';
  if (roles.includes('hod')) return 'hod';
  return 'staff';
}
