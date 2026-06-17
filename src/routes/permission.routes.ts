import { Router, Request, Response } from 'express';
import { Op, Sequelize } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Permission } from '@models/Permission.model';
import { RolePermission } from '@models/RolePermission.model';
import { Role } from '@models/Role.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// All permission management routes are superadmin-only
router.use(AuthMiddleware.requireRole('superadmin'));

// GET /api/admin/permissions
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, module: mod, action, isActive, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (mod) where.module = mod;
  if (action) where.action = action;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) where[Op.or] = [
    { name: { [Op.iLike]: `%${search}%` } },
    { code: { [Op.iLike]: `%${search}%` } },
  ];

  const { count, rows } = await Permission.findAndCountAll({
    where, order: [['module', 'ASC'], ['resource', 'ASC'], ['action', 'ASC']],
    limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/admin/permissions/modules
router.get('/modules', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const result = await Permission.findAll({
    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('module')), 'module']],
    order: [['module', 'ASC']],
  });
  const modules = result.map((r: any) => r.module);
  ResponseFormatter.success(res, modules);
}));

// GET /api/admin/permissions/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const permission = await Permission.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
  });
  if (!permission) return ResponseFormatter.error(res, 'Permission not found', 404);

  const rolePerms = await RolePermission.findAll({ where: { permissionId: (permission as any).id } });
  const roleIds = rolePerms.map((rp: any) => rp.roleId);
  const roles = roleIds.length > 0 ? await Role.findAll({ where: { id: { [Op.in]: roleIds } }, attributes: ['id', 'uuid', 'code', 'name'] }) : [];

  ResponseFormatter.success(res, { ...permission.toJSON(), roles });
}));

// POST /api/admin/permissions
router.post('/', AuthMiddleware.requirePermission('RBAC.PERMISSION.CREATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { code, name, description, module: mod, resource, action, scope } = req.body;
  if (!code || !name || !mod || !resource || !action || !scope) {
    return ResponseFormatter.error(res, 'code, name, module, resource, action, scope are required', 400);
  }

  const existing = await Permission.findOne({ where: { code } });
  if (existing) return ResponseFormatter.error(res, 'Permission code already exists', 409);

  const permission = await Permission.create({
    uuid: uuidv4(), code, name, description,
    module: mod, resource, action, scope, isActive: true,
  } as any);
  ResponseFormatter.success(res, permission, 'Permission created', 201);
}));

// PUT /api/admin/permissions/:id
router.put('/:id', AuthMiddleware.requirePermission('RBAC.PERMISSION.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const permission = await Permission.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!permission) return ResponseFormatter.error(res, 'Permission not found', 404);

  const { name, description, isActive } = req.body;
  await permission.update({ name, description, isActive });
  ResponseFormatter.success(res, permission, 'Permission updated');
}));

// DELETE /api/admin/permissions/:id
router.delete('/:id', AuthMiddleware.requirePermission('RBAC.PERMISSION.DELETE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const permission = await Permission.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!permission) return ResponseFormatter.error(res, 'Permission not found', 404);

  const assignedCount = await RolePermission.count({ where: { permissionId: (permission as any).id } });
  if (assignedCount > 0) return ResponseFormatter.error(res, `Permission assigned to ${assignedCount} role(s), revoke first`, 400);

  await permission.destroy();
  ResponseFormatter.success(res, null, 'Permission deleted');
}));

export default router;
