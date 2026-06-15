import nodemailer from 'nodemailer';
import twilio from 'twilio';
import admin from 'firebase-admin';
import Notification from '../models/Notification.model';
import NotificationTemplate from '../models/NotificationTemplate.model';
import EmailLog from '../models/EmailLog.model';
import SMSLog from '../models/SMSLog.model';
import PushLog from '../models/PushLog.model';
import NotificationPreference from '../models/NotificationPreference.model';
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

export class NotificationService extends BaseService {
  private emailTransporter: any;
  private twilioClient: any;
  private firebaseAdmin: any;

  constructor() {
    super();
    this.initializeProviders();
  }

  private initializeProviders() {
    // Email configuration
    this.emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // SMS configuration (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }

    // Push notification configuration (Firebase)
    if (process.env.FIREBASE_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
        databaseURL: process.env.FIREBASE_DB_URL,
      });
      this.firebaseAdmin = admin;
    }
  }

  /**
   * Create and send notifications via multiple channels
   */
  async sendNotification(data: INotificationData): Promise<INotification> {
    const userId = this.getCurrentUserId();
    
    // Get user preferences
    const preferences = await NotificationPreference.findOne({
      where: {
        organizationId: data.organizationId,
        staffId: data.staffId,
      },
    });

    // Create notification record
    const notification = await Notification.create({
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

    // Send via enabled channels
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

  /**
   * Send real-time notification via Socket.IO
   */
  private async sendRealTimeNotification(notification: INotification) {
    try {
      // Emit via Socket.IO (requires socket integration)
      // socket.to(`user:${notification.staffId}`).emit('notification', {
      //   id: notification.id,
      //   title: notification.title,
      //   message: notification.message,
      //   timestamp: new Date(),
      // });

      await Notification.update(
        { deliveryStatus: 'DELIVERED' },
        { where: { id: notification.id } }
      );
    } catch (error) {
      console.error('Real-time notification error:', error);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    data: INotificationData,
    notification: INotification,
    preferences: any
  ) {
    try {
      let emailBody = data.message;

      // Get template if specified
      if (data.templateCode) {
        const template = await NotificationTemplate.findOne({
          where: { code: data.templateCode },
        });
        if (template) {
          emailBody = this.interpolateTemplate(template.templateBody, data.variables || {});
        }
      }

      // Get staff email from database
      // const staff = await Staff.findByPk(data.staffId);
      const staffEmail = 'user@example.com'; // Replace with actual email lookup

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@kuriossats.com',
        to: staffEmail,
        subject: data.title,
        html: this.generateEmailHTML(data.title, emailBody, data.actionUrl),
      };

      // Send email
      await this.emailTransporter.sendMail(mailOptions);

      // Log delivery
      await EmailLog.create({
        organizationId: data.organizationId,
        notificationId: notification.id,
        recipientEmail: staffEmail,
        subject: data.title,
        bodyHtml: mailOptions.html,
        deliveryStatus: 'SENT',
        sentAt: new Date(),
      });

      await Notification.update(
        { deliveryStatus: 'SENT' },
        { where: { id: notification.id } }
      );
    } catch (error) {
      console.error('Email notification error:', error);
      await Notification.update(
        { 
          deliveryStatus: 'FAILED',
          failureReason: (error as Error).message,
        },
        { where: { id: notification.id } }
      );
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(
    data: INotificationData,
    notification: INotification,
    preferences: any
  ) {
    if (!this.twilioClient) {
      console.warn('Twilio client not configured');
      return;
    }

    try {
      // Get staff phone number from database
      // const staff = await Staff.findByPk(data.staffId);
      const staffPhone = '+1234567890'; // Replace with actual phone lookup

      const message = await this.twilioClient.messages.create({
        body: data.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: staffPhone,
      });

      // Log delivery
      await SMSLog.create({
        organizationId: data.organizationId,
        notificationId: notification.id,
        recipientPhone: staffPhone,
        messageText: data.message,
        deliveryStatus: 'SENT',
        sentAt: new Date(),
        providerReference: message.sid,
      });

      await Notification.update(
        { deliveryStatus: 'SENT' },
        { where: { id: notification.id } }
      );
    } catch (error) {
      console.error('SMS notification error:', error);
      await Notification.update(
        {
          deliveryStatus: 'FAILED',
          failureReason: (error as Error).message,
        },
        { where: { id: notification.id } }
      );
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(
    data: INotificationData,
    notification: INotification,
    preferences: any
  ) {
    if (!this.firebaseAdmin) {
      console.warn('Firebase not configured');
      return;
    }

    try {
      // Get device tokens for user (from DeviceRegistration table)
      // const devices = await DeviceRegistration.findAll({
      //   where: { staffId: data.staffId, isActive: true },
      // });

      // For now, mock device tokens
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

      // Send to all devices
      for (const deviceToken of deviceTokens) {
        try {
          await this.firebaseAdmin.messaging().sendToDevice(deviceToken, message);

          await PushLog.create({
            organizationId: data.organizationId,
            notificationId: notification.id,
            deviceToken,
            devicePlatform: 'ANDROID',
            title: data.title,
            body: data.message,
            deliveryStatus: 'SENT',
            sentAt: new Date(),
          });
        } catch (deviceError) {
          console.error(`Push error for device ${deviceToken}:`, deviceError);
        }
      }

      await Notification.update(
        { deliveryStatus: 'DELIVERED' },
        { where: { id: notification.id } }
      );
    } catch (error) {
      console.error('Push notification error:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: bigint, staffId: bigint) {
    const notification = await this.checkPermission(
      staffId,
      'notifications.read.own'
    );

    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { id: notificationId, staffId } }
    );

    return notification;
  }

  /**
   * Get notifications for a staff member
   */
  async getNotifications(
    staffId: bigint,
    organizationId: bigint,
    limit: number = 20,
    offset: number = 0
  ) {
    const notifications = await Notification.findAndCountAll({
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

  /**
   * Get unread count
   */
  async getUnreadCount(staffId: bigint, organizationId: bigint) {
    const count = await Notification.count({
      where: {
        organizationId,
        staffId,
        isRead: false,
      },
    });

    return count;
  }

  /**
   * Helper: Interpolate template variables
   */
  private interpolateTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    Object.keys(variables).forEach(key => {
      result = result.replace(`{{${key}}}`, variables[key]);
    });
    return result;
  }

  /**
   * Helper: Generate HTML email
   */
  private generateEmailHTML(title: string, message: string, actionUrl?: string): string {
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

export default new NotificationService();
