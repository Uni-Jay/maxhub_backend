import { RoleCode } from './RolesConfig';

/**
 * Maps a staff member's free-text position to the RBAC role they should be
 * assigned. Position is still not a role in its own right (most positions
 * here just resolve to 'staff' with extra UI on their dashboard, e.g.
 * Accountant) — this only exists to auto-assign the handful of positions
 * that DO correspond 1:1 to a real role, instead of every new staff member
 * silently getting 'staff' regardless of what position they were hired into.
 *
 * Keys are matched case-insensitively against Staff.position. Anything not
 * listed here defaults to RoleCode.STAFF.
 */
export const POSITION_ROLE_MAP: Record<string, RoleCode> = {
  // Super Admin — the CEO and the developer
  'ceo': RoleCode.SUPERADMIN,
  'chief executive officer': RoleCode.SUPERADMIN,
  'developer': RoleCode.SUPERADMIN,
  'lead developer': RoleCode.SUPERADMIN,
  'software developer': RoleCode.SUPERADMIN,
  // Admin — Manager, Directors, Head Admin, Head HR (full access, but cannot approve their own requests)
  'manager': RoleCode.ADMIN,
  'general manager': RoleCode.ADMIN,
  'director': RoleCode.ADMIN,
  'managing director': RoleCode.ADMIN,
  'executive director': RoleCode.ADMIN,
  'head of admin': RoleCode.ADMIN,
  'head admin': RoleCode.ADMIN,
  'head of administration': RoleCode.ADMIN,
  'head hr': RoleCode.ADMIN,
  'head of hr': RoleCode.ADMIN,
  'hr manager': RoleCode.ADMIN,
  'hr': RoleCode.HR,
  'human resources': RoleCode.HR,
  'hr officer': RoleCode.HR,
  'accountant': RoleCode.ACCOUNTANT,
  'senior accountant': RoleCode.ACCOUNTANT,
  'account officer': RoleCode.ACCOUNTANT,
  'finance officer': RoleCode.ACCOUNTANT,
  'hod': RoleCode.HOD,
  'head of department': RoleCode.HOD,
  'administrative staff': RoleCode.STAFF,
  'staff': RoleCode.STAFF,
};

export function resolveRoleForPosition(position?: string | null): RoleCode {
  if (!position) return RoleCode.STAFF;
  return POSITION_ROLE_MAP[position.trim().toLowerCase()] ?? RoleCode.STAFF;
}
