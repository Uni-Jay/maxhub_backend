"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveMailboxCredentials = resolveMailboxCredentials;
exports.getOrCreateTransporter = getOrCreateTransporter;
exports.sendViaTransporter = sendViaTransporter;
const nodemailer_1 = __importDefault(require("nodemailer"));
function resolveMailboxCredentials(emailVar, passwordVar) {
    const dedicatedPass = process.env[passwordVar];
    if (dedicatedPass) {
        return { user: process.env[emailVar] || process.env.SMTP_USER || '', pass: dedicatedPass };
    }
    return { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASSWORD || '' };
}
const transporterCache = new Map();
function getOrCreateTransporter(user, pass) {
    const key = `${user}:${pass}`;
    let transporter = transporterCache.get(key);
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '465', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: { user, pass },
        });
        transporterCache.set(key, transporter);
    }
    return transporter;
}
async function sendViaTransporter(transporter, from, options) {
    const { to, subject, html, attachments } = options;
    if (!process.env.SMTP_HOST) {
        console.log(`[Email] (no SMTP_HOST configured) To: ${to} | From: ${from.name} <${from.address}> | Subject: ${subject}`);
        return true;
    }
    try {
        await transporter.sendMail({
            from: `"${from.name}" <${from.address}>`,
            to,
            subject,
            html,
            attachments,
        });
        return true;
    }
    catch (err) {
        console.error(`[Email] Send failed (from ${from.address} to ${to}):`, err);
        return false;
    }
}
//# sourceMappingURL=email.service.js.map