import cron from 'node-cron';
import { Op } from 'sequelize';
import { Client } from '../models/Client.model';
import { CommunicationLog } from '../models/CommunicationLog.model';
import { sendMessage, buildWeeklyMessage, buildBirthdayMessage } from './CommunicationService';

const COMPANY_NAME = process.env.COMPANY_NAME || 'MaxHub';
const CHANNELS = ['Email', 'SMS', 'WhatsApp'] as const;

/**
 * Send weekly messages every Monday at 8:00 AM
 */
function scheduleWeeklyMessages(): void {
  cron.schedule('0 8 * * 1', async () => {
    console.log('[Scheduler] Running weekly message job...');
    const clients = await Client.findAll({
      where: { status: 'Active' },
      attributes: ['id', 'fullName', 'email', 'phone'],
    });

    for (const channel of CHANNELS) {
      let successCount = 0;
      let failureCount = 0;
      const message = buildWeeklyMessage(channel, { id: 0, fullName: '{name}', email: '', phone: '' }, COMPANY_NAME);
      const subject = channel === 'Email' ? `New Week Greetings from ${COMPANY_NAME}` : undefined;

      const log = await CommunicationLog.create({
        type: 'Weekly',
        channel,
        recipientType: 'All',
        message,
        subject,
        totalRecipients: clients.length,
        status: 'Sending',
        sentAt: new Date(),
      });

      for (const client of clients) {
        const personalMessage = buildWeeklyMessage(channel, client.toJSON() as any, COMPANY_NAME);
        const ok = await sendMessage(channel, client.toJSON() as any, subject, personalMessage);
        if (ok) successCount++;
        else failureCount++;
      }

      await log.update({
        successCount,
        failureCount,
        status: failureCount === 0 ? 'Completed' : successCount === 0 ? 'Failed' : 'Partial',
      });

      console.log(`[Scheduler] Weekly ${channel}: ${successCount}/${clients.length} sent`);
    }
  }, { timezone: 'Africa/Lagos' });

  console.log('[Scheduler] Weekly message job scheduled (every Monday 8:00 AM)');
}

/**
 * Check for client birthdays every day at 7:00 AM
 */
function scheduleBirthdayMessages(): void {
  cron.schedule('0 7 * * *', async () => {
    console.log('[Scheduler] Running birthday check...');
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayPattern = `%-${month}-${day}`;

    // Find clients whose birthday is today
    const clients = await Client.findAll({
      where: {
        status: 'Active',
        dateOfBirth: { [Op.like]: todayPattern } as any,
      } as any,
      attributes: ['id', 'fullName', 'email', 'phone', 'dateOfBirth'],
    });

    if (clients.length === 0) {
      console.log('[Scheduler] No birthdays today');
      return;
    }

    console.log(`[Scheduler] Found ${clients.length} birthday(s) today`);

    for (const client of clients) {
      for (const channel of CHANNELS) {
        const message = buildBirthdayMessage(channel, client.toJSON() as any, COMPANY_NAME);
        const subject = channel === 'Email' ? `Happy Birthday from ${COMPANY_NAME}!` : undefined;
        const ok = await sendMessage(channel, client.toJSON() as any, subject, message);

        await CommunicationLog.create({
          type: 'Birthday',
          channel,
          recipientType: 'Selected',
          message,
          subject,
          totalRecipients: 1,
          successCount: ok ? 1 : 0,
          failureCount: ok ? 0 : 1,
          status: ok ? 'Completed' : 'Failed',
          sentAt: new Date(),
        });
      }
    }
  }, { timezone: 'Africa/Lagos' });

  console.log('[Scheduler] Birthday job scheduled (daily at 7:00 AM)');
}

export function startScheduler(): void {
  scheduleWeeklyMessages();
  scheduleBirthdayMessages();
  console.log('[Scheduler] All jobs started');
}
