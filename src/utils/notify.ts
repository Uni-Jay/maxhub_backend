import { Notification } from '@models/Notification.model';
import { Staff } from '@models/Staff.model';

type NotificationType = 'Message' | 'Mention' | 'Assignment' | 'Leave' | 'Payroll' | 'System' | 'Alert' | 'Other';
type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

interface NotifyParams {
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: bigint | number | string;
  actionUrl?: string;
  priority?: NotificationPriority;
}

/**
 * Creates a Notification row for a user and, if a Socket.IO server instance
 * is passed, pushes it live to every socket that user currently has open
 * (so the bell updates immediately instead of waiting for the frontend's
 * 30-60s poll). This is the one notification-creation path in the app —
 * there used to be a separate NotificationService/NotificationController
 * pair that wrote to fields the real Notification model doesn't have
 * (organizationId, staffId, category, deliveryStatus) and was never wired
 * into any route; it's been removed. Every real notification in this app —
 * project/task assignment, comments — goes through here.
 */
export async function notifyUser(userId: bigint | number | string, params: NotifyParams, io?: any): Promise<void> {
  const notification = await Notification.create({
    recipientUserId: userId,
    notificationType: params.type,
    title: params.title,
    message: params.message,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId,
    actionUrl: params.actionUrl,
    deliveryChannel: 'InApp',
    priority: params.priority || 'Medium',
  } as any);

  if (io) {
    try {
      const { emitToUser } = require('../socket/ChatSocket');
      emitToUser(io, Number(userId), 'notification:new', notification.toJSON());
    } catch {
      // non-fatal — the notification is already persisted; the frontend's poll will pick it up
    }
  }
}

/** Same as notifyUser, but resolves a Staff ID to its linked User ID first. */
export async function notifyStaff(staffId: bigint | number | string, params: NotifyParams, io?: any): Promise<void> {
  const staff = await Staff.findByPk(staffId, { attributes: ['userId'] });
  if (!staff?.userId) return;
  await notifyUser(staff.userId, params, io);
}
