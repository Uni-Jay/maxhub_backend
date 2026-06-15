"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const twilio_1 = __importDefault(require("twilio"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const Notification_model_1 = __importDefault(require("../models/Notification.model"));
const NotificationTemplate_model_1 = __importDefault(require("../models/NotificationTemplate.model"));
const EmailLog_model_1 = __importDefault(require("../models/EmailLog.model"));
const SMSLog_model_1 = __importDefault(require("../models/SMSLog.model"));
const PushLog_model_1 = __importDefault(require("../models/PushLog.model"));
const NotificationPreference_model_1 = __importDefault(require("../models/NotificationPreference.model"));
const BaseService_1 = __importDefault(require("./BaseService"));
class NotificationService extends BaseService_1.default {
    constructor() {
        super();
        this.initializeProviders();
    }
    initializeProviders() {
        this.emailTransporter = nodemailer_1.default.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        if (process.env.TWILIO_ACCOUNT_SID) {
            this.twilioClient = (0, twilio_1.default)(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        }
        if (process.env.FIREBASE_CREDENTIALS) {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
                databaseURL: process.env.FIREBASE_DB_URL,
            });
            this.firebaseAdmin = firebase_admin_1.default;
        }
    }
    async sendNotification(data) {
        const userId = this.getCurrentUserId();
        const preferences = await NotificationPreference_model_1.default.findOne({
            where: {
                organizationId: data.organizationId,
                staffId: data.staffId,
            },
        });
        const notification = await Notification_model_1.default.create({
            organizationId: data.organizationId,
            staffId: data.staffId,
            type: data.type || 'IN_APP',
            category: data.category,
            title: data.title,
            message: data.message,
            relatedEntityType: data.relatedEntityType,
            relatedEntityId: data.relatedEntityId,
            actionUrl: data.actionUrl,
            deliveryStatus: 'PENDING',
        });
        if (preferences) {
            if (preferences.realTimeEnabled) {
                await this.sendRealTimeNotification(notification);
            }
            if (preferences.emailEnabled && preferences.categories.includes(data.category)) {
                await this.sendEmailNotification(data, notification, preferences);
            }
            if (preferences.smsEnabled && preferences.categories.includes(data.category)) {
                await this.sendSMSNotification(data, notification, preferences);
            }
            if (preferences.pushEnabled && preferences.categories.includes(data.category)) {
                await this.sendPushNotification(data, notification, preferences);
            }
        }
        return notification;
    }
    async sendRealTimeNotification(notification) {
        try {
            await Notification_model_1.default.update({ deliveryStatus: 'DELIVERED' }, { where: { id: notification.id } });
        }
        catch (error) {
            console.error('Real-time notification error:', error);
        }
    }
    async sendEmailNotification(data, notification, preferences) {
        try {
            let emailBody = data.message;
            if (data.templateCode) {
                const template = await NotificationTemplate_model_1.default.findOne({
                    where: { code: data.templateCode },
                });
                if (template) {
                    emailBody = this.interpolateTemplate(template.templateBody, data.variables || {});
                }
            }
            const staffEmail = 'user@example.com';
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@kuriossats.com',
                to: staffEmail,
                subject: data.title,
                html: this.generateEmailHTML(data.title, emailBody, data.actionUrl),
            };
            await this.emailTransporter.sendMail(mailOptions);
            await EmailLog_model_1.default.create({
                organizationId: data.organizationId,
                notificationId: notification.id,
                recipientEmail: staffEmail,
                subject: data.title,
                bodyHtml: mailOptions.html,
                deliveryStatus: 'SENT',
                sentAt: new Date(),
            });
            await Notification_model_1.default.update({ deliveryStatus: 'SENT' }, { where: { id: notification.id } });
        }
        catch (error) {
            console.error('Email notification error:', error);
            await Notification_model_1.default.update({
                deliveryStatus: 'FAILED',
                failureReason: error.message,
            }, { where: { id: notification.id } });
        }
    }
    async sendSMSNotification(data, notification, preferences) {
        if (!this.twilioClient) {
            console.warn('Twilio client not configured');
            return;
        }
        try {
            const staffPhone = '+1234567890';
            const message = await this.twilioClient.messages.create({
                body: data.message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: staffPhone,
            });
            await SMSLog_model_1.default.create({
                organizationId: data.organizationId,
                notificationId: notification.id,
                recipientPhone: staffPhone,
                messageText: data.message,
                deliveryStatus: 'SENT',
                sentAt: new Date(),
                providerReference: message.sid,
            });
            await Notification_model_1.default.update({ deliveryStatus: 'SENT' }, { where: { id: notification.id } });
        }
        catch (error) {
            console.error('SMS notification error:', error);
            await Notification_model_1.default.update({
                deliveryStatus: 'FAILED',
                failureReason: error.message,
            }, { where: { id: notification.id } });
        }
    }
    async sendPushNotification(data, notification, preferences) {
        if (!this.firebaseAdmin) {
            console.warn('Firebase not configured');
            return;
        }
        try {
            const deviceTokens = ['mock_device_token_1', 'mock_device_token_2'];
            const message = {
                notification: {
                    title: data.title,
                    body: data.message,
                },
                data: {
                    actionUrl: data.actionUrl || '',
                    category: data.category,
                },
            };
            for (const deviceToken of deviceTokens) {
                try {
                    await this.firebaseAdmin.messaging().sendToDevice(deviceToken, message);
                    await PushLog_model_1.default.create({
                        organizationId: data.organizationId,
                        notificationId: notification.id,
                        deviceToken,
                        devicePlatform: 'ANDROID',
                        title: data.title,
                        body: data.message,
                        deliveryStatus: 'SENT',
                        sentAt: new Date(),
                    });
                }
                catch (deviceError) {
                    console.error(`Push error for device ${deviceToken}:`, deviceError);
                }
            }
            await Notification_model_1.default.update({ deliveryStatus: 'DELIVERED' }, { where: { id: notification.id } });
        }
        catch (error) {
            console.error('Push notification error:', error);
        }
    }
    async markAsRead(notificationId, staffId) {
        const notification = await this.checkPermission(staffId, 'notifications.read.own');
        await Notification_model_1.default.update({ isRead: true, readAt: new Date() }, { where: { id: notificationId, staffId } });
        return notification;
    }
    async getNotifications(staffId, organizationId, limit = 20, offset = 0) {
        const notifications = await Notification_model_1.default.findAndCountAll({
            where: {
                organizationId,
                staffId,
            },
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });
        return {
            data: notifications.rows,
            pagination: {
                total: notifications.count,
                limit,
                offset,
            },
        };
    }
    async getUnreadCount(staffId, organizationId) {
        const count = await Notification_model_1.default.count({
            where: {
                organizationId,
                staffId,
                isRead: false,
            },
        });
        return count;
    }
    interpolateTemplate(template, variables) {
        let result = template;
        Object.keys(variables).forEach(key => {
            result = result.replace(`{{${key}}}`, variables[key]);
        });
        return result;
    }
    generateEmailHTML(title, message, actionUrl) {
        return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
            <h2 style="color: #333;">${title}</h2>
            <p>${message}</p>
            ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View More</a>` : ''}
            <hr style="margin-top: 20px; border: none; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666;">© 2026 Kurios Sat. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
    }
}
exports.NotificationService = NotificationService;
exports.default = new NotificationService();
//# sourceMappingURL=NotificationService.js.map