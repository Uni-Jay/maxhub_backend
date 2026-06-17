import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '@models/Module.model';
import { UserModulePermission } from '@models/UserModulePermission.model';
import { User } from '@models/User.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// All module management routes are superadmin-only
router.use(AuthMiddleware.requireRole('superadmin'));

const DEFAULT_MODULES = [
  { name: 'Dashboard',          code: 'dashboard',       icon: 'LayoutDashboard', isDefault: true,  displayOrder: 1  },
  { name: 'Staff Management',   code: 'staff',           icon: 'Users',           isDefault: true,  displayOrder: 2  },
  { name: 'Attendance',         code: 'attendance',      icon: 'Clock',           isDefault: true,  displayOrder: 3  },
  { name: 'Leave Management',   code: 'leave',           icon: 'Calendar',        isDefault: true,  displayOrder: 4  },
  { name: 'Projects',           code: 'projects',        icon: 'FolderKanban',    isDefault: true,  displayOrder: 5  },
  { name: 'Tasks',              code: 'tasks',           icon: 'CheckSquare',     isDefault: true,  displayOrder: 6  },
  { name: 'CRM',                code: 'crm',             icon: 'UserCheck',       isDefault: false, displayOrder: 7  },
  { name: 'Clients',            code: 'clients',         icon: 'Building',        isDefault: true,  displayOrder: 8  },
  { name: 'Payroll',            code: 'payroll',         icon: 'DollarSign',      isDefault: false, displayOrder: 9  },
  { name: 'Inventory',          code: 'inventory',       icon: 'Package',         isDefault: false, displayOrder: 10 },
  { name: 'Learning (LMS)',     code: 'lms',             icon: 'BookOpen',        isDefault: true,  displayOrder: 11 },
  { name: 'Recruitment (HR)',   code: 'recruitment',     icon: 'UserPlus',        isDefault: false, displayOrder: 12 },
  { name: 'Messaging',          code: 'messaging',       icon: 'MessageSquare',   isDefault: true,  displayOrder: 13 },
  { name: 'Video Calls',        code: 'videocall',       icon: 'Video',           isDefault: true,  displayOrder: 14 },
  { name: 'Calendar',           code: 'calendar',        icon: 'CalendarDays',    isDefault: true,  displayOrder: 15 },
  { name: 'File Manager',       code: 'files',           icon: 'FolderOpen',      isDefault: true,  displayOrder: 16 },
  { name: 'Analytics',          code: 'analytics',       icon: 'BarChart',        isDefault: false, displayOrder: 17 },
  { name: 'Invoices / Sales',   code: 'invoices',        icon: 'Receipt',         isDefault: false, displayOrder: 18 },
  { name: 'Communication',      code: 'communication',   icon: 'Mail',            isDefault: true,  displayOrder: 19 },
  { name: 'Audit Logs',         code: 'audit',           icon: 'Shield',          isDefault: false, displayOrder: 20 },
  { name: 'AI Assistant',       code: 'ai',              icon: 'Bot',             isDefault: false, displayOrder: 21 },
  { name: 'Reports',            code: 'reports',         icon: 'FileText',        isDefault: false, displayOrder: 22 },
  { name: 'Roles & Permissions',code: 'roles',           icon: 'Key',             isDefault: false, displayOrder: 23 },
  { name: 'System Settings',    code: 'settings',        icon: 'Settings',        isDefault: false, displayOrder: 24 },
];

// POST /api/modules/seed — seed default modules (idempotent)
router.post('/seed', ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
  let created = 0;
  for (const mod of DEFAULT_MODULES) {
    const [, wasCreated] = await AppModule.findOrCreate({
      where: { code: mod.code },
      defaults: { ...mod, uuid: uuidv4() } as any,
    });
    if (wasCreated) created++;
  }
  ResponseFormatter.success(res, { seeded: created, total: DEFAULT_MODULES.length }, `Seeded ${created} new modules`);
}));

// GET /api/modules
router.get('/', ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
  const modules = await AppModule.findAll({ order: [['displayOrder', 'ASC'], ['name', 'ASC']] });
  ResponseFormatter.success(res, modules);
}));

// POST /api/modules
router.post('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name, code, description, icon, isDefault, displayOrder } = req.body;
  if (!name || !code) return ResponseFormatter.error(res, 'name and code are required', 400);

  const existing = await AppModule.findOne({ where: { code } });
  if (existing) return ResponseFormatter.error(res, 'Module code already exists', 409);

  const mod = await AppModule.create({ uuid: uuidv4(), name, code, description, icon, isDefault: isDefault ?? false, displayOrder: displayOrder ?? 0 } as any);
  ResponseFormatter.success(res, mod, 'Module created', 201);
}));

// PATCH /api/modules/:id
router.patch('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const mod = await AppModule.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }, { code: req.params.id }] } });
  if (!mod) return ResponseFormatter.error(res, 'Module not found', 404);

  const { name, description, icon, isActive, isDefault, displayOrder } = req.body;
  await mod.update({ name, description, icon, isActive, isDefault, displayOrder });
  ResponseFormatter.success(res, mod, 'Module updated');
}));

// DELETE /api/modules/:id
router.delete('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const mod = await AppModule.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }, { code: req.params.id }] } });
  if (!mod) return ResponseFormatter.error(res, 'Module not found', 404);
  if ((mod as any).isDefault) return ResponseFormatter.error(res, 'Cannot delete a default module', 400);

  await mod.destroy();
  ResponseFormatter.success(res, null, 'Module deleted');
}));

// ── User Module Permission management ──────────────────────────────────────────

// GET /api/modules/user-permissions/:userId — get all module permissions for a user
router.get('/user-permissions/:userId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const perms = await UserModulePermission.findAll({ where: { userId: req.params.userId } });
  ResponseFormatter.success(res, perms);
}));

// PUT /api/modules/user-permissions/:userId — upsert module permissions for a user
router.put('/user-permissions/:userId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { permissions } = req.body; // Array<{ moduleCode, canView, canCreate, canEdit, canDelete }>

  if (!Array.isArray(permissions)) return ResponseFormatter.error(res, 'permissions array required', 400);

  const user = await User.findByPk(userId);
  if (!user) return ResponseFormatter.error(res, 'User not found', 404);

  await Promise.all(
    permissions.map(async (p: any) => {
      await UserModulePermission.upsert({
        userId: BigInt(userId),
        moduleCode: p.moduleCode,
        canView: p.canView ?? false,
        canCreate: p.canCreate ?? false,
        canEdit: p.canEdit ?? false,
        canDelete: p.canDelete ?? false,
      } as any);
    })
  );

  const updated = await UserModulePermission.findAll({ where: { userId } });
  ResponseFormatter.success(res, updated, 'Module permissions updated');
}));

// DELETE /api/modules/user-permissions/:userId/:moduleCode — remove specific override
router.delete('/user-permissions/:userId/:moduleCode', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { userId, moduleCode } = req.params;
  await UserModulePermission.destroy({ where: { userId, moduleCode } });
  ResponseFormatter.success(res, null, 'Permission override removed');
}));

export default router;
