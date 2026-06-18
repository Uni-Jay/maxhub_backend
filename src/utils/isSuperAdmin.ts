import { Request } from 'express';

/**
 * Exact role check for the literal `superadmin` role only — no bypass for
 * Admin/HeadOfAdmin like AuthMiddleware.requirePermission() has. Used to gate
 * approval actions (publish job posting, activate training, approve/reject
 * appraisals and weekly reports) that must stay superadmin-only even though
 * Admin/HeadOfAdmin otherwise have full access.
 */
export function isSuperAdmin(req: Request): boolean {
  return (req.user?.roles || []).some(
    (r: string) => r.toLowerCase().replace(/[^a-z]/g, '') === 'superadmin'
  );
}
