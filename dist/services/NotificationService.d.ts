import BaseService from './BaseService';
import { INotification } from '../models/Notification.model';
export interface INotificationData {
    staffId: bigint;
    organizationId: bigint;
    title: string;
    message: string;
    category: string;
    type?: 'REAL_TIME' | 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
    templateCode?: string;
    variables?: Record<string, any>;
    relatedEntityType?: string;
    relatedEntityId?: bigint;
    actionUrl?: string;
}
export declare class NotificationService extends BaseService {
    private emailTransporter;
    private twilioClient;
    private firebaseAdmin;
    constructor();
    private initializeProviders;
    sendNotification(data: INotificationData): Promise<INotification>;
    private sendRealTimeNotification;
    private sendEmailNotification;
    private sendSMSNotification;
    private sendPushNotification;
    markAsRead(notificationId: bigint, staffId: bigint): Promise<any>;
    getNotifications(staffId: bigint, organizationId: bigint, limit?: number, offset?: number): Promise<{
        data: any;
        pagination: {
            total: any;
            limit: number;
            offset: number;
        };
    }>;
    getUnreadCount(staffId: bigint, organizationId: bigint): Promise<any>;
    private interpolateTemplate;
    private generateEmailHTML;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=NotificationService.d.ts.map