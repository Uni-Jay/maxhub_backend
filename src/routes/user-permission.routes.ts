import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { User } from '@models/User.model';
import { Role } from '@models/Role.model';
import { UserRole } from '@models/UserRole.model';
import { RolePermission } from '@models/RolePermission.model';
import { Permission } from '@models/Permission.model';
import { UserPermission } from '@models/UserPermission.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

/**
 * Lets a Super Admin grant or revoke a specific PermissionCode for one user
 * directly — without changing their role. AuthenticationService.ts already
 * merges these direct grants (UserPermission) with role-derived ones into
 * every JWT/login response, so this only needed an admin-facing surface;
 * the enforcement side was already wired.
 */

// GET /api/users/:userId/permissions — role-derived (read-only context) + direct overrides (editable)
router.get('/:userId/permissions', AuthMiddleware.requireRole('superadmin'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const userId = BigInt(req.params.userId);
  const user = await User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName', 'email'] });
  if (!user) return ResponseFormatter.notFound(res, 'User not found');

  const userRoles = await UserRole.findAll({ where: { userId } });
  const roleIds = userRoles.map((ur: any) => ur.roleId);
  const roles = roleIds.length ? await Role.findAll({ where: { id: { [Op.in]: roleIds } }, attributes: ['id', 'code', 'name'] }) : [];

  const rolePermissionRows = roleIds.length
    ? await RolePermission.findAll({ where: { roleId: { [Op.in]: roleIds } }, attributes: ['permissionId'] })
    : [];
  const rolePermissionIds = [...new Set(rolePermissionRows.map((rp: any) => rp.permissionId))];
  const roleDerivedPermissions = rolePermissionIds.length
    ? await Permission.findAll({ where: { id: { [Op.in]: rolePermissionIds } }, attributes: ['code', 'name', 'module'] })
    : [];

  const directRows = await UserPermission.findAll({ where: { userId } });
  const directPermissionIds = directRows.map((up: any) => up.permissionId);
  const directPermissions = directPermissionIds.length
    ? await Permission.findAll({ where: { id: { [Op.in]: directPermissionIds } }, attributes: ['code', 'name', 'module'] })
    : [];

  ResponseFormatter.success(res, {
    user: { id: Number(user.id), firstName: (user as any).firstName, lastName: (user as any).lastName, email: (user as any).email },
    roles: roles.map((r: any) => ({ code: r.code, name: r.name })),
    roleDerivedPermissions: roleDerivedPermissions.map((p: any) => ({ code: p.code, name: p.name, module: p.module })),
    directPermissions: directPermissions.map((p: any) => ({ code: p.code, name: p.name, module: p.module })),
  });
}));

// POST /api/users/:userId/permissions — grant one PermissionCode directly. Body: { code, reason? }
router.post('/:userId/permissions', AuthMiddleware.requireRole('superadmin'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const userId = BigInt(req.params.userId);
  const { code, reason } = req.body;
  if (!code) return ResponseFormatter.error(res, 'code is required', 400);

  const [user, permission] = await Promise.all([
    User.findByPk(userId),
    Permission.findOne({ where: { code } }),
  ]);
  if (!user) return ResponseFormatter.notFound(res, 'User not found');
  if (!permission) return ResponseFormatter.notFound(res, `Permission code not found: ${code}`);

  await UserPermission.findOrCreate({
    where: { userId, permissionId: (permission as any).id },
    defaults: { userId, permissionId: (permission as any).id, reason } as any,
  });

  ResponseFormatter.success(res, null, `Granted ${code} to this user`, 201);
}));

// DELETE /api/users/:userId/permissions/:code — revoke a direct grant (role-derived permissions can't be removed here)
router.delete('/:userId/permissions/:code', AuthMiddleware.requireRole('superadmin'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const userId = BigInt(req.params.userId);
  const permission = await Permission.findOne({ where: { code: req.params.code } });
  if (!permission) return ResponseFormatter.notFound(res, `Permission code not found: ${req.params.code}`);

  const grant = await UserPermission.findOne({ where: { userId, permissionId: (permission as any).id } });
  if (!grant) return ResponseFormatter.notFound(res, 'This user does not have a direct grant for that permission');

  await grant.destroy({ force: true });
  ResponseFormatter.success(res, null, 'Permission revoked');
}));

export default router;
