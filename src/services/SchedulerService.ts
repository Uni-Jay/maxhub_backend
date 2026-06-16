import cron from 'node-cron';
import { Op } from 'sequelize';
import { Client } from '../models/Client.model';
import { Staff } from '../models/Staff.model';
import { CommunicationLog } from '../models/CommunicationLog.model';
import { sendMessage, buildWeeklyMessage, buildBirthdayMessage, sendBirthdayEmail } from './CommunicationService';

const COMPANY_NAME = process.env.COMPANY_NAME || 'MaxHub';
const CHANNELS = ['Email', 'SMS', 'WhatsApp'] as const;

/** MM-DD pattern for today — matches both DATEONLY (YYYY-MM-DD) and DATETIME columns */
function todayMMDD(): { month: string; day: string } {
  const now = new Date();
  return {
    month: String(now.getMonth() + 1).padStart(2, '0'),
    day: String(now.getDate()).padStart(2, '0'),
  };
}

/**
 * Send weekly messages to all active clients — every Monday at 8:00 AM
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
 * Send birthday emails to staff and clients whose birthday is today — daily at 7:00 AM
 */
function scheduleBirthdayMessages(): void {
  cron.schedule('0 7 * * *', async () => {
    console.log('[Scheduler] Running birthday check...');
    const { month, day } = todayMMDD();

    // DATEONLY column (clients): stored as YYYY-MM-DD, match with %-MM-DD
    const clientPattern = `%-${month}-${day}`;
    // DATE/DATETIME column (staff): stored as YYYY-MM-DD HH:mm:ss, match with %-MM-DD%
    const staffPattern  = `%-${month}-${day}%`;

    const [clients, staffMembers] = await Promise.all([
      Client.findAll({
        where: { status: 'Active', dateOfBirth: { [Op.like]: clientPattern } as any } as any,
        attributes: ['id', 'fullName', 'email', 'phone'],
      }),
      Staff.findAll({
        where: { status: 'Active', dateOfBirth: { [Op.like]: staffPattern } as any } as any,
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      }),
    ]);

    const totalBirthdays = clients.length + staffMembers.length;
    if (totalBirthdays === 0) {
      console.log('[Scheduler] No birthdays today');
      return;
    }

    console.log(`[Scheduler] ${clients.length} client(s), ${staffMembers.length} staff birthday(s) today`);

    // ── Client birthdays: email + SMS + WhatsApp channels ──
    for (const client of clients) {
      const data = client.toJSON() as any;

      for (const channel of CHANNELS) {
        const message = buildBirthdayMessage(channel, data, COMPANY_NAME);
        const subject = channel === 'Email' ? `Happy Birthday from ${COMPANY_NAME}! 🎂` : undefined;

        // For email, use the branded birthday template
        let ok: boolean;
        if (channel === 'Email') {
          ok = await sendBirthdayEmail({ to: data.email, fullName: data.fullName, type: 'client' });
        } else {
          ok = await sendMessage(channel, data, subject, message);
        }

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
        }).catch(() => {});
      }
    }

    // ── Staff birthdays: email only ──
    for (const member of staffMembers) {
      const data = member.toJSON() as any;
      const fullName = `${data.firstName} ${data.lastName}`;
      const email: string = data.email;

      if (!email) continue;

      const ok = await sendBirthdayEmail({ to: email, fullName, type: 'staff' });

      await CommunicationLog.create({
        type: 'Birthday',
        channel: 'Email',
        recipientType: 'Selected',
        message: `Birthday wishes sent to staff: ${fullName}`,
        subject: `Happy Birthday from ${COMPANY_NAME}! 🎂`,
        totalRecipients: 1,
        successCount: ok ? 1 : 0,
        failureCount: ok ? 0 : 1,
        status: ok ? 'Completed' : 'Failed',
        sentAt: new Date(),
      }).catch(() => {});

      console.log(`[Scheduler] Birthday email → staff ${fullName} <${email}>: ${ok ? 'sent' : 'failed'}`);
    }

    console.log(`[Scheduler] Birthday job done — ${totalBirthdays} wish(es) sent`);
  }, { timezone: 'Africa/Lagos' });

  console.log('[Scheduler] Birthday job scheduled (daily at 7:00 AM)');
}

export function startScheduler(): void {
  scheduleWeeklyMessages();
  scheduleBirthdayMessages();
  console.log('[Scheduler] All jobs started');
}
