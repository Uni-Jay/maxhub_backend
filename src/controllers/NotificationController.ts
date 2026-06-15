import { Response } from 'express';
import BaseController from './BaseController';
import NotificationService from '../services/NotificationService';
import { IAuthRequest } from '../types/express';

export class NotificationController extends BaseController {
  /**
   * Send notification
   * POST /api/notifications
   */
  async sendNotification(req: IAuthRequest, res: Response) {
    const { staffId, title, message, category, type, templateCode, variables, relatedEntityType, relatedEntityId, actionUrl } = req.body;
    const organizationId = req.user?.organizationId || BigInt(0);

    await this.checkPermission(req.user?.id || BigInt(0), 'notifications.create.all');

    const notification = await NotificationService.sendNotification({
      staffId: BigInt(staffId),
      organizationId: BigInt(organizationId),
      title,
      message,
      category,
      type,
      templateCode,
      variables,
      relatedEntityType,
      relatedEntityId: relatedEntityId ? BigInt(relatedEntityId) : undefined,
      actionUrl,
    });

    return this.sendSuccess(res, notification, 'Notification sent successfully', 201);
  }

  /**
   * Mark notification as read
   * PUT /api/notifications/:id/read
   */
  async markAsRead(req: IAuthRequest, res: Response) {
    const { id } = req.params;
    const staffId = req.user?.id || BigInt(0);

    await this.checkPermission(staffId, 'notifications.read.own');

    await NotificationService.markAsRead(BigInt(id), staffId);

    return this.sendSuccess(res, null, 'Notification marked as read');
  }

  /**
   * Get notifications
   * GET /api/notifications
   */
  async getNotifications(req: IAuthRequest, res: Response) {
    const staffId = req.user?.id || BigInt(0);
    const organizationId = req.user?.organizationId || BigInt(0);
    const { limit = 20, offset = 0 } = req.query;

    await this.checkPermission(staffId, 'notifications.read.own');

    const result = await NotificationService.getNotifications(
      staffId,
      BigInt(organizationId),
      parseInt(limit as string),
      parseInt(offset as string)
    );

    return this.sendPaginated(res, result.data, result.pagination, 'Notifications retrieved successfully');
  }

  /**
   * Get unread notification count
   * GET /api/notifications/unread/count
   */
  async getUnreadCount(req: IAuthRequest, res: Response) {
    const staffId = req.user?.id || BigInt(0);
    const organizationId = req.user?.organizationId || BigInt(0);

    await this.checkPermission(staffId, 'notifications.read.own');

    const unreadCount = await NotificationService.getUnreadCount(
      staffId,
      BigInt(organizationId)
    );

    return this.sendSuccess(res, { unreadCount }, 'Unread count retrieved');
  }

  /**
   * Get preferences
   * GET /api/notifications/preferences
   */
  async getPreferences(req: IAuthRequest, res: Response) {
    const staffId = req.user?.id || BigInt(0);
    const organizationId = req.user?.organizationId || BigInt(0);

    await this.checkPermission(staffId, 'notifications.preferences.read.own');

    const preferences = await NotificationService.getPreferences(staffId, BigInt(organizationId));

    return this.sendSuccess(res, preferences, 'Preferences retrieved');
  }

  /**
   * Update preferences
   * PUT /api/notifications/preferences
   */
  async updatePreferences(req: IAuthRequest, res: Response) {
    const staffId = req.user?.id || BigInt(0);
    const organizationId = req.user?.organizationId || BigInt(0);

    await this.checkPermission(staffId, 'notifications.preferences.update.own');

    const preferences = await NotificationService.updatePreferences(
      staffId,
      BigInt(organizationId),
      req.body
    );

    return this.sendSuccess(res, preferences, 'Preferences updated');
  }
}

export default new NotificationController();
