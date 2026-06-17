"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduler = startScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const Client_model_1 = require("../models/Client.model");
const Staff_model_1 = require("../models/Staff.model");
const CommunicationLog_model_1 = require("../models/CommunicationLog.model");
const CommunicationService_1 = require("./CommunicationService");
const COMPANY_NAME = process.env.COMPANY_NAME || 'MaxHub';
const CHANNELS = ['Email', 'SMS', 'WhatsApp'];
function todayMMDD() {
    const now = new Date();
    return {
        month: String(now.getMonth() + 1).padStart(2, '0'),
        day: String(now.getDate()).padStart(2, '0'),
    };
}
function scheduleWeeklyMessages() {
    node_cron_1.default.schedule('0 8 * * 1', async () => {
        console.log('[Scheduler] Running weekly message job...');
        const clients = await Client_model_1.Client.findAll({
            where: { status: 'Active' },
            attributes: ['id', 'fullName', 'email', 'phone'],
        });
        for (const channel of CHANNELS) {
            let successCount = 0;
            let failureCount = 0;
            const message = (0, CommunicationService_1.buildWeeklyMessage)(channel, { id: 0, fullName: '{name}', email: '', phone: '' }, COMPANY_NAME);
            const subject = channel === 'Email' ? `New Week Greetings from ${COMPANY_NAME}` : undefined;
            const log = await CommunicationLog_model_1.CommunicationLog.create({
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
                const personalMessage = (0, CommunicationService_1.buildWeeklyMessage)(channel, client.toJSON(), COMPANY_NAME);
                const ok = await (0, CommunicationService_1.sendMessage)(channel, client.toJSON(), subject, personalMessage);
                if (ok)
                    successCount++;
                else
                    failureCount++;
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
function scheduleBirthdayMessages() {
    node_cron_1.default.schedule('0 7 * * *', async () => {
        console.log('[Scheduler] Running birthday check...');
        const { month, day } = todayMMDD();
        const clientPattern = `%-${month}-${day}`;
        const staffPattern = `%-${month}-${day}%`;
        const [clients, staffMembers] = await Promise.all([
            Client_model_1.Client.findAll({
                where: { status: 'Active', dateOfBirth: { [sequelize_1.Op.iLike]: clientPattern } },
                attributes: ['id', 'fullName', 'email', 'phone'],
            }),
            Staff_model_1.Staff.findAll({
                where: { status: 'Active', dateOfBirth: { [sequelize_1.Op.iLike]: staffPattern } },
                attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
            }),
        ]);
        const totalBirthdays = clients.length + staffMembers.length;
        if (totalBirthdays === 0) {
            console.log('[Scheduler] No birthdays today');
            return;
        }
        console.log(`[Scheduler] ${clients.length} client(s), ${staffMembers.length} staff birthday(s) today`);
        for (const client of clients) {
            const data = client.toJSON();
            for (const channel of CHANNELS) {
                const message = (0, CommunicationService_1.buildBirthdayMessage)(channel, data, COMPANY_NAME);
                const subject = channel === 'Email' ? `Happy Birthday from ${COMPANY_NAME}! 🎂` : undefined;
                let ok;
                if (channel === 'Email') {
                    ok = await (0, CommunicationService_1.sendBirthdayEmail)({ to: data.email, fullName: data.fullName, type: 'client' });
                }
                else {
                    ok = await (0, CommunicationService_1.sendMessage)(channel, data, subject, message);
                }
                await CommunicationLog_model_1.CommunicationLog.create({
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
                }).catch(() => { });
            }
        }
        for (const member of staffMembers) {
            const data = member.toJSON();
            const fullName = `${data.firstName} ${data.lastName}`;
            const email = data.email;
            if (!email)
                continue;
            const ok = await (0, CommunicationService_1.sendBirthdayEmail)({ to: email, fullName, type: 'staff' });
            await CommunicationLog_model_1.CommunicationLog.create({
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
            }).catch(() => { });
            console.log(`[Scheduler] Birthday email → staff ${fullName} <${email}>: ${ok ? 'sent' : 'failed'}`);
        }
        console.log(`[Scheduler] Birthday job done — ${totalBirthdays} wish(es) sent`);
    }, { timezone: 'Africa/Lagos' });
    console.log('[Scheduler] Birthday job scheduled (daily at 7:00 AM)');
}
function startScheduler() {
    scheduleWeeklyMessages();
    scheduleBirthdayMessages();
    console.log('[Scheduler] All jobs started');
}
//# sourceMappingURL=SchedulerService.js.map