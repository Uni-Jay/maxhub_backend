import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Notification } from '@models/Notification.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/notifications — my notifications
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { page = 1, limit = 20, isRead, notificationType, priority } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where: any = { recipientUserId: user.id };
  if (isRead !== undefined) where.isRead = isRead === 'true';
  if (notificationType) where.notificationType = notificationType;
  if (priority) where.priority = priority;

  const { count, rows } = await Notification.findAndCountAll({
    where, order: [['createdAt', 'DESC']], limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/notifications/unread-count
router.get('/unread-count', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const count = await Notification.count({ where: { recipientUserId: user.id, isRead: false } });
  ResponseFormatter.success(res, { count });
}));

// PATCH /api/notifications/:id/read
router.patch('/:id/read', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const notification = await Notification.findOne({
    where: { ...idOrUuidWhere(req.params.id), recipientUserId: user.id },
  });
  if (!notification) return ResponseFormatter.error(res, 'Notification not found', 404);
  if (!notification.isRead) {
    await notification.update({ isRead: true, readAt: new Date() });
  }
  ResponseFormatter.success(res, notification, 'Marked as read');
}));

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const [updated] = await Notification.update(
    { isRead: true, readAt: new Date() },
    { where: { recipientUserId: user.id, isRead: false } }
  );
  ResponseFormatter.success(res, { updated }, 'All notifications marked as read');
}));

// DELETE /api/notifications/:id
router.delete('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const notification = await Notification.findOne({
    where: { ...idOrUuidWhere(req.params.id), recipientUserId: user.id },
  });
  if (!notification) return ResponseFormatter.error(res, 'Notification not found', 404);
  await notification.destroy();
  ResponseFormatter.success(res, null, 'Notification deleted');
}));

// POST /api/notifications — create (admin)
router.post('/', AuthMiddleware.requirePermission('comm.notification.create.all', 'sys.notification.create.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { recipientUserId, notificationType, title, message, actionUrl, priority, deliveryChannel } = req.body;
  if (!recipientUserId || !notificationType || !title || !message) {
    return ResponseFormatter.error(res, 'recipientUserId, notificationType, title, message are required', 400);
  }

  const notification = await Notification.create({
    uuid: uuidv4(), recipientUserId, notificationType, title, message,
    actionUrl, priority: priority || 'Medium',
    deliveryChannel: deliveryChannel || 'InApp', isRead: false,
  } as any);
  ResponseFormatter.success(res, notification, 'Notification created', 201);
}));

export default router;
