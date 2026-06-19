import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Broadcast } from '@models/Broadcast.model';
import { Staff } from '@models/Staff.model';
import { StaffDepartment } from '@models/StaffDepartment.model';
import { Notification } from '@models/Notification.model';
import { Role } from '@models/Role.model';
import { UserRole } from '@models/UserRole.model';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';

const router = Router();

function hasPermission(req: Request, code: string): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  if (roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin')) return true;
  const perms = new Set(((req as any).user?.permissions || []).map((p: string) => String(p).toLowerCase()));
  return perms.has(code.toLowerCase());
}

/** Resolves every user id holding any of the given role codes — used to auto-copy HR/Admin/Super Admin on a department announcement. */
async function getUserIdsForRoles(roleCodes: string[]): Promise<bigint[]> {
  const roles = await Role.findAll({ where: { code: { [Op.in]: roleCodes } }, attributes: ['id'] });
  const roleIds = roles.map((r: any) => r.id);
  if (!roleIds.length) return [];
  const userRoles = await UserRole.findAll({ where: { roleId: { [Op.in]: roleIds } }, attributes: ['userId'] });
  return [...new Set(userRoles.map((ur: any) => ur.userId))];
}

// GET /api/broadcasts
router.get('/', AuthMiddleware.requirePermission(PermissionCode.BROADCAST_READ_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const broadcasts = await Broadcast.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
  ResponseFormatter.success(res, broadcasts);
}));

// POST /api/broadcasts — create and immediately deliver to the chosen audience via Notification
router.post('/', AuthMiddleware.requirePermission(PermissionCode.BROADCAST_CREATE_ALL, PermissionCode.BROADCAST_CREATE_OWN_DEPARTMENT), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const canCreateAll = hasPermission(req, PermissionCode.BROADCAST_CREATE_ALL);
  const user = (req as any).user;
  let { title, message, audienceType = 'All', audienceValue } = req.body;

  if (!title || !message) {
    return ResponseFormatter.error(res, 'title and message are required', 400);
  }

  // HOD: always a department announcement scoped to her own department, regardless of what was submitted.
  if (!canCreateAll) {
    if (!user?.departmentId) {
      return ResponseFormatter.error(res, 'No department linked to this account', 400);
    }
    audienceType = 'Department';
    audienceValue = String(user.departmentId);
  }

  if (audienceType !== 'All' && !audienceValue) {
    return ResponseFormatter.error(res, 'audienceValue is required for BusinessUnit/Department audiences', 400);
  }

  const broadcast = await Broadcast.create({
    title,
    message,
    audienceType,
    audienceValue,
    createdById: BigInt(user.id),
  } as any);

  const recipientUserIds = new Set<bigint>();

  if (audienceType === 'BusinessUnit') {
    const recipients = await Staff.findAll({ where: { businessUnit: audienceValue }, attributes: ['userId'] });
    recipients.forEach((s: any) => s.userId && recipientUserIds.add(s.userId));
  } else if (audienceType === 'Department') {
    // A staff member belonging to this department either as primary
    // (Staff.departmentId) or secondary (via StaffDepartment) should both
    // receive a department-wide announcement — short-staffed teams often
    // have staff covering multiple departments.
    const deptId = BigInt(audienceValue);
    const [primaryStaff, secondaryLinks] = await Promise.all([
      Staff.findAll({ where: { departmentId: deptId }, attributes: ['userId'] }),
      StaffDepartment.findAll({ where: { departmentId: deptId }, attributes: ['staffId'] }),
    ]);
    primaryStaff.forEach((s: any) => s.userId && recipientUserIds.add(s.userId));
    const secondaryStaffIds = secondaryLinks.map((l: any) => l.staffId);
    if (secondaryStaffIds.length) {
      const secondaryStaff = await Staff.findAll({ where: { id: { [Op.in]: secondaryStaffIds } }, attributes: ['userId'] });
      secondaryStaff.forEach((s: any) => s.userId && recipientUserIds.add(s.userId));
    }
  } else if (audienceType === 'All') {
    const recipients = await Staff.findAll({ attributes: ['userId'] });
    recipients.forEach((s: any) => s.userId && recipientUserIds.add(s.userId));
  }

  // Department announcements from a HOD are always copied to HR, Admin, and Super Admin.
  if (!canCreateAll) {
    const ccUserIds = await getUserIdsForRoles(['hr', 'admin', 'superadmin']);
    ccUserIds.forEach((id) => recipientUserIds.add(id));
  }

  const recipientUserIdList = [...recipientUserIds];

  if (recipientUserIdList.length > 0) {
    await Notification.bulkCreate(
      recipientUserIdList.map((userId) => ({
        recipientUserId: userId,
        notificationType: 'Alert',
        title,
        message,
        relatedEntityType: 'Broadcast',
        relatedEntityId: broadcast.id,
        deliveryChannel: 'InApp',
        priority: 'Medium',
      })) as any
    );
  }

  ResponseFormatter.success(res, { ...broadcast.toJSON(), recipientCount: recipientUserIdList.length }, 'Broadcast sent', 201);
}));

// DELETE /api/broadcasts/:id
router.delete('/:id', AuthMiddleware.requirePermission(PermissionCode.BROADCAST_DELETE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const broadcast = await Broadcast.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!broadcast) return ResponseFormatter.notFound(res, 'Broadcast not found');
  await broadcast.destroy();
  ResponseFormatter.success(res, null, 'Broadcast deleted');
}));

export default router;
