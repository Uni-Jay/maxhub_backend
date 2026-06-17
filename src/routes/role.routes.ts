import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '@models/Role.model';
import { Permission } from '@models/Permission.model';
import { RolePermission } from '@models/RolePermission.model';
import { UserRole } from '@models/UserRole.model';
import { User } from '@models/User.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// All role management routes are superadmin-only
router.use(AuthMiddleware.requireRole('superadmin'));

// GET /api/admin/roles
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const roles = await Role.findAll({
    order: [['isSystemRole', 'DESC'], ['name', 'ASC']],
  });

  const rolesWithCount = await Promise.all(roles.map(async (role) => {
    const [permCount, userCount] = await Promise.all([
      RolePermission.count({ where: { roleId: (role as any).id } }),
      UserRole.count({ where: { roleId: (role as any).id } }),
    ]);
    return { ...role.toJSON(), permissionCount: permCount, userCount };
  }));

  ResponseFormatter.success(res, rolesWithCount);
}));

// GET /api/admin/roles/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
  });
  if (!role) return ResponseFormatter.error(res, 'Role not found', 404);

  const permissions = await Permission.findAll({
    include: [{ model: RolePermission, as: 'rolePermissions', where: { roleId: (role as any).id }, required: true }],
  });

  ResponseFormatter.success(res, { ...role.toJSON(), permissions });
}));

// POST /api/admin/roles
router.post('/', AuthMiddleware.requirePermission('RBAC.ROLE.CREATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { code, name, description } = req.body;
  if (!code || !name) return ResponseFormatter.error(res, 'code and name are required', 400);

  const existing = await Role.findOne({ where: { code } });
  if (existing) return ResponseFormatter.error(res, 'Role code already exists', 409);

  const role = await Role.create({
    uuid: uuidv4(), code, name, description,
    isSystemRole: false, isActive: true,
  } as any);
  ResponseFormatter.success(res, role, 'Role created', 201);
}));

// PUT /api/admin/roles/:id
router.put('/:id', AuthMiddleware.requirePermission('RBAC.ROLE.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!role) return ResponseFormatter.error(res, 'Role not found', 404);
  if ((role as any).isSystemRole) return ResponseFormatter.error(res, 'Cannot edit system roles', 403);

  const { name, description, isActive } = req.body;
  await role.update({ name, description, isActive });
  ResponseFormatter.success(res, role, 'Role updated');
}));

// DELETE /api/admin/roles/:id
router.delete('/:id', AuthMiddleware.requirePermission('RBAC.ROLE.DELETE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!role) return ResponseFormatter.error(res, 'Role not found', 404);
  if ((role as any).isSystemRole) return ResponseFormatter.error(res, 'Cannot delete system roles', 403);

  const userCount = await UserRole.count({ where: { roleId: (role as any).id } });
  if (userCount > 0) return ResponseFormatter.error(res, `Cannot delete role with ${userCount} active users`, 400);

  await role.destroy();
  ResponseFormatter.success(res, null, 'Role deleted');
}));

// POST /api/admin/roles/:id/permissions — assign permissions
router.post('/:id/permissions', AuthMiddleware.requirePermission('RBAC.ROLE.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!role) return ResponseFormatter.error(res, 'Role not found', 404);

  const { permissionIds } = req.body;
  if (!Array.isArray(permissionIds)) return ResponseFormatter.error(res, 'permissionIds array required', 400);

  await Promise.all(permissionIds.map((pid: number) =>
    RolePermission.findOrCreate({
      where: { roleId: (role as any).id, permissionId: pid },
      defaults: { roleId: (role as any).id, permissionId: pid } as any,
    })
  ));
  ResponseFormatter.success(res, null, 'Permissions assigned');
}));

// DELETE /api/admin/roles/:id/permissions/:permissionId
router.delete('/:id/permissions/:permissionId', AuthMiddleware.requirePermission('RBAC.ROLE.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!role) return ResponseFormatter.error(res, 'Role not found', 404);

  await RolePermission.destroy({ where: { roleId: (role as any).id, permissionId: req.params.permissionId } });
  ResponseFormatter.success(res, null, 'Permission revoked');
}));

// GET /api/admin/roles/:id/users
router.get('/:id/users', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const role = await Role.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!role) return ResponseFormatter.error(res, 'Role not found', 404);

  const userRoles = await UserRole.findAll({
    where: { roleId: (role as any).id },
    include: [{ model: User, attributes: ['id', 'uuid', 'firstName', 'lastName', 'email', 'avatar', 'status'] }],
  });
  ResponseFormatter.success(res, userRoles);
}));

export default router;
