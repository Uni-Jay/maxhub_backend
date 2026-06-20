import nodemailer, { Transporter } from 'nodemailer';

export interface MailSender {
  name: string;
  address: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
}

/**
 * Resolves a {user, pass} pair atomically: if the dedicated password env var
 * is set, use the dedicated email+password together; otherwise fall back to
 * the legacy single-mailbox SMTP_USER/SMTP_PASSWORD pair in full. Never mixes
 * a dedicated email with the legacy password (or vice versa) — that combo
 * authenticates as the wrong mailbox and fails outright.
 */
export function resolveMailboxCredentials(emailVar: string, passwordVar: string): { user: string; pass: string } {
  const dedicatedPass = process.env[passwordVar];
  if (dedicatedPass) {
    return { user: process.env[emailVar] || process.env.SMTP_USER || '', pass: dedicatedPass };
  }
  return { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASSWORD || '' };
}

/**
 * Builds a single nodemailer transporter for a given mailbox. Caches by
 * user+pass so repeated calls (every email send) reuse one connection pool
 * instead of opening a new transporter per request.
 */
const transporterCache = new Map<string, Transporter>();

export function getOrCreateTransporter(user: string, pass: string): Transporter {
  const key = `${user}:${pass}`;
  let transporter = transporterCache.get(key);
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    transporterCache.set(key, transporter);
  }
  return transporter;
}

/**
 * Sends an email through the given transporter/sender. Falls back to a
 * console log (instead of throwing) when no SMTP host is configured at all —
 * preserves the existing dev-mode behavior where the whole mail stack is a
 * no-op until SMTP_HOST is set.
 */
export async function sendViaTransporter(
  transporter: Transporter,
  from: MailSender,
  options: SendEmailOptions
): Promise<boolean> {
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
  } catch (err) {
    console.error(`[Email] Send failed (from ${from.address} to ${to}):`, err);
    return false;
  }
}
