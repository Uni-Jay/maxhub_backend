import { Router, Request, Response } from 'express';
import { Broadcast } from '@models/Broadcast.model';
import { Staff } from '@models/Staff.model';
import { Notification } from '@models/Notification.model';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';

const router = Router();

// GET /api/broadcasts
router.get('/', AuthMiddleware.requirePermission(PermissionCode.BROADCAST_READ_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const broadcasts = await Broadcast.findAll({ order: [['createdAt', 'DESC']], limit: 100 });
  ResponseFormatter.success(res, broadcasts);
}));

// POST /api/broadcasts — create and immediately deliver to the chosen audience via Notification
router.post('/', AuthMiddleware.requirePermission(PermissionCode.BROADCAST_CREATE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { title, message, audienceType = 'All', audienceValue } = req.body;
  if (!title || !message) {
    return ResponseFormatter.error(res, 'title and message are required', 400);
  }
  if (audienceType !== 'All' && !audienceValue) {
    return ResponseFormatter.error(res, 'audienceValue is required for BusinessUnit/Department audiences', 400);
  }

  const broadcast = await Broadcast.create({
    title,
    message,
    audienceType,
    audienceValue,
    createdById: BigInt((req as any).user.id),
  } as any);

  const where: Record<string, unknown> = {};
  if (audienceType === 'BusinessUnit') where.businessUnit = audienceValue;
  if (audienceType === 'Department') where.departmentId = BigInt(audienceValue);

  const recipients = await Staff.findAll({ where, attributes: ['userId'] });
  const recipientUserIds = [...new Set(recipients.map((s: any) => s.userId).filter(Boolean))];

  if (recipientUserIds.length > 0) {
    await Notification.bulkCreate(
      recipientUserIds.map((userId) => ({
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

  ResponseFormatter.success(res, { ...broadcast.toJSON(), recipientCount: recipientUserIds.length }, 'Broadcast sent', 201);
}));

// DELETE /api/broadcasts/:id
router.delete('/:id', AuthMiddleware.requirePermission(PermissionCode.BROADCAST_DELETE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const broadcast = await Broadcast.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!broadcast) return ResponseFormatter.notFound(res, 'Broadcast not found');
  await broadcast.destroy();
  ResponseFormatter.success(res, null, 'Broadcast deleted');
}));

export default router;
