import { Response } from 'express';
import BaseController from './BaseController';
import { IAuthRequest } from '../types/express';
export declare class NotificationController extends BaseController {
    sendNotification(req: IAuthRequest, res: Response): Promise<any>;
    markAsRead(req: IAuthRequest, res: Response): Promise<any>;
    getNotifications(req: IAuthRequest, res: Response): Promise<any>;
    getUnreadCount(req: IAuthRequest, res: Response): Promise<any>;
    getPreferences(req: IAuthRequest, res: Response): Promise<any>;
    updatePreferences(req: IAuthRequest, res: Response): Promise<any>;
}
declare const _default: NotificationController;
export default _default;
//# sourceMappingURL=NotificationController.d.ts.map