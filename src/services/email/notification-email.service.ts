import { getOrCreateTransporter, sendViaTransporter, resolveMailboxCredentials, MailSender } from './email.service';
import AIService from '../AIService';

export interface MessageRecipient {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}

/**
 * General ERP/system mail: auth, OTP, approvals, payroll/finance alerts,
 * platform notifications. Authenticates as INFO_EMAIL/INFO_PASSWORD when
 * configured; falls back to the legacy single-mailbox SMTP_USER/
 * SMTP_PASSWORD (both together, never mixed) while INFO_EMAIL isn't set yet.
 */
function getNotificationCredentials() {
  return resolveMailboxCredentials('INFO_EMAIL', 'INFO_PASSWORD');
}

function getNotificationTransporter() {
  const { user, pass } = getNotificationCredentials();
  return getOrCreateTransporter(user, pass);
}

function getNotificationSender(): MailSender {
  // INFO_FROM is a pure display alias — only safe to show if INFO_EMAIL is
  // actually the mailbox we authenticated as (and that mailbox has the alias
  // configured in Zoho). Otherwise show the real authenticating address.
  const { user } = getNotificationCredentials();
  const configured = !!process.env.INFO_PASSWORD;
  return {
    name: 'MaxHub ERP',
    address: configured ? (process.env.INFO_FROM || process.env.INFO_EMAIL || user) : (process.env.EMAIL_FROM || user),
  };
}

function sendNotification(options: { to: string; subject: string; html: string }): Promise<boolean> {
  return sendViaTransporter(getNotificationTransporter(), getNotificationSender(), options);
}

/**
 * Send a message via email, SMS, or WhatsApp. Email uses the notification
 * mailbox. SMS/WhatsApp are stubbed for provider integration.
 */
export async function sendMessage(
  channel: 'Email' | 'SMS' | 'WhatsApp',
  recipient: MessageRecipient,
  subject: string | undefined,
  body: string
): Promise<boolean> {
  try {
    const personalizedBody = personalizeMessage(body, recipient);

    if (channel === 'Email') {
      return await sendNotification({ to: recipient.email, subject: subject || 'Message from MaxHub', html: personalizedBody });
    } else if (channel === 'SMS') {
      return await sendSMS(recipient.phone, personalizedBody);
    } else if (channel === 'WhatsApp') {
      return await sendWhatsApp(recipient.phone, personalizedBody);
    }
    return false;
  } catch {
    return false;
  }
}

function personalizeMessage(template: string, recipient: MessageRecipient): string {
  return template
    .replace(/\{name\}/gi, recipient.fullName)
    .replace(/\{firstName\}/gi, recipient.fullName.split(' ')[0])
    .replace(/\{email\}/gi, recipient.email);
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[SMS] To: ${phone} | Message: ${message.substring(0, 80)}...`);
    return true;
  }
  return true;
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  console.log(`[WhatsApp] To: ${phone} | Message: ${message.substring(0, 80)}...`);
  return true;
}

/**
 * Confirms a successful password change and includes the new password as a
 * record, since the user requested this as an explicit confirmation/backup —
 * sent only after the change is already verified via OTP and applied.
 */
export async function sendPasswordChangedEmail(params: {
  to: string;
  firstName: string;
  newPassword: string;
}): Promise<boolean> {
  const { to, firstName, newPassword } = params;
  const companyName = process.env.COMPANY_NAME || 'MaxHub';
  const loginUrl = process.env.FRONTEND_URL || 'https://www.maxhubng.company';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Password Was Changed</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">✅ Password Changed</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${companyName} ERP</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Hello, ${firstName}!</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              Your password was just changed successfully. For your records, your new password is shown below.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1px;color:#059669;text-transform:uppercase;">New Password</p>
                  <span style="font-family:monospace;font-size:18px;font-weight:700;color:#111827;background:#fff;border:1px solid #a7f3d0;border-radius:8px;padding:6px 16px;display:inline-block;">${newPassword}</span>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
              <tr>
                <td style="padding:14px 18px;font-size:12px;color:#92400e;line-height:1.5;">
                  ⚠️ If you did not make this change, contact your administrator immediately.
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
              <tr>
                <td align="center">
                  <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 32px;border-radius:10px;">
                    Sign In
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              This is an automated email from ${companyName} ERP. Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendNotification({ to, subject: `Your password was changed — ${companyName}`, html });
}

/**
 * Send a promotion confirmation email once a Super Admin approves it.
 */
export async function sendPromotionEmail(params: {
  to: string;
  firstName: string;
  lastName: string;
  newDesignation?: string;
  newDepartment?: string;
  effectiveDate?: string | Date;
  approvalRemarks?: string;
}): Promise<boolean> {
  const { to, firstName, lastName, newDesignation, newDepartment, effectiveDate, approvalRemarks } = params;
  const loginUrl = process.env.FRONTEND_URL || 'https://www.maxhubng.company';
  const companyName = process.env.COMPANY_NAME || 'MaxHub';
  const effectiveDateStr = effectiveDate ? new Date(effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Congratulations on Your Promotion</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#10b981 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🎉 Congratulations, ${firstName}!</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your promotion has been approved</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              We're delighted to let you know that your promotion at ${companyName} has been reviewed and approved by Super Admin.
              Thank you for your continued hard work and dedication.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1px;color:#059669;text-transform:uppercase;">Promotion Details</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #d1fae5;font-size:13px;color:#6b7280;width:140px;">Name</td>
                      <td style="padding:8px 0;border-bottom:1px solid #d1fae5;font-size:14px;font-weight:600;color:#111827;">${firstName} ${lastName}</td>
                    </tr>
                    ${newDesignation ? `<tr><td style="padding:8px 0;border-bottom:1px solid #d1fae5;font-size:13px;color:#6b7280;">New Position</td><td style="padding:8px 0;border-bottom:1px solid #d1fae5;font-size:14px;font-weight:700;color:#059669;">${newDesignation}</td></tr>` : ''}
                    ${newDepartment ? `<tr><td style="padding:8px 0;border-bottom:1px solid #d1fae5;font-size:13px;color:#6b7280;">Department</td><td style="padding:8px 0;border-bottom:1px solid #d1fae5;font-size:14px;color:#111827;">${newDepartment}</td></tr>` : ''}
                    ${effectiveDateStr ? `<tr><td style="padding:8px 0;${approvalRemarks ? 'border-bottom:1px solid #d1fae5;' : ''}font-size:13px;color:#6b7280;">Effective Date</td><td style="padding:8px 0;${approvalRemarks ? 'border-bottom:1px solid #d1fae5;' : ''}font-size:14px;color:#111827;">${effectiveDateStr}</td></tr>` : ''}
                    ${approvalRemarks ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">Remarks</td><td style="padding:8px 0;font-size:14px;color:#111827;">${approvalRemarks}</td></tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#059669,#10b981);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;">
                    Sign In to MaxHub
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              This is an automated email from ${companyName} ERP. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendNotification({ to, subject: `Congratulations on your promotion at ${companyName}!`, html });
}

/**
 * Send a branded birthday wish email.
 */
export async function sendBirthdayEmail(params: {
  to: string;
  fullName: string;
  type: 'staff' | 'client';
}): Promise<boolean> {
  const { to, fullName, type } = params;
  const firstName = fullName.split(' ')[0];
  const companyName = process.env.COMPANY_NAME || 'MaxHub';

  const personalMessage = await AIService.generateBirthdayMessage({ firstName, type, companyName });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Happy Birthday from ${companyName}!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px;text-align:center;">
            <div style="font-size:52px;margin-bottom:12px;">🎂</div>
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">Happy Birthday!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">From everyone at ${companyName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;text-align:center;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">
              Dear ${firstName}, 🎉
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;max-width:440px;display:inline-block;">
              On this special day, all of us at <strong style="color:#4f46e5;">${companyName}</strong> want to wish you
              a very <strong>Happy Birthday!</strong> May this day be filled with joy, laughter, and everything
              you deserve.
            </p>

            <!-- Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;border-radius:16px;margin:8px 0 28px;">
              <tr>
                <td style="padding:28px;text-align:center;">
                  <p style="margin:0;font-size:28px;">🌟 🎈 🥳</p>
                  <p style="margin:12px 0 0;font-size:16px;font-weight:600;color:#4f46e5;font-style:italic;">
                    "Wishing you a year full of happiness,<br/>success, and great memories!"
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.7;max-width:440px;display:inline-block;">
              ${personalMessage}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              With warm birthday wishes,<br/>
              <strong style="color:#4f46e5;">${companyName} Team</strong>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendNotification({ to, subject: `Happy Birthday from ${companyName}! 🎂`, html });
}

/**
 * Send a branded OTP verification email.
 */
export async function sendOTPEmail(params: {
  to: string;
  firstName: string;
  otpCode: string;
  type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | '2FA' | 'PASSWORD_CHANGE';
  expiryMinutes?: number;
}): Promise<boolean> {
  const { to, firstName, otpCode, type, expiryMinutes = 10 } = params;
  const companyName = process.env.COMPANY_NAME || 'MaxHub';

  const config = {
    PASSWORD_RESET: {
      subject: `Password Reset Code — ${companyName}`,
      title: 'Reset Your Password',
      subtitle: 'You requested a password reset. Use the code below to continue.',
      warning: "If you didn't request this, please ignore this email or contact your administrator immediately.",
      icon: '🔑',
    },
    EMAIL_VERIFICATION: {
      subject: `Verify Your Email — ${companyName}`,
      title: 'Email Verification',
      subtitle: 'Please enter this code to verify your email address.',
      warning: "If you didn't create an account, please ignore this email.",
      icon: '✉️',
    },
    '2FA': {
      subject: `${companyName} Security Verification Code`,
      title: 'Security Verification',
      subtitle: 'Use this code to complete your sign-in. It expires in 10 minutes.',
      warning: "If you didn't attempt to sign in, please secure your account immediately.",
      icon: '🔒',
    },
    PASSWORD_CHANGE: {
      subject: `Confirm Your Password Change — ${companyName}`,
      title: 'Confirm Password Change',
      subtitle: 'Enter this code to confirm you want to change your password.',
      warning: "If you didn't request this, please ignore this email and your password will stay unchanged.",
      icon: '🔐',
    },
  };

  const { subject, title, subtitle, warning, icon } = config[type];
  const digits = otpCode.split('');
  const digitBoxes = digits
    .map(d => `<span style="display:inline-block;width:44px;height:56px;line-height:56px;margin:0 3px;background:#ffffff;border:2px solid #c4b5fd;border-radius:10px;font-size:26px;font-weight:800;color:#4f46e5;font-family:monospace;text-align:center;">${d}</span>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
            <div style="font-size:40px;margin-bottom:10px;">${icon}</div>
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">${companyName} ERP</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${title}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Hello, ${firstName}!</p>
            <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.6;">${subtitle}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:2px solid #e0d9ff;border-radius:14px;margin-bottom:28px;">
              <tr>
                <td style="padding:28px;text-align:center;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#7c3aed;text-transform:uppercase;">Your Verification Code</p>
                  <div>${digitBoxes}</div>
                  <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">This code expires in ${expiryMinutes} minutes. Do not share it with anyone.</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
              <tr>
                <td style="padding:14px 18px;font-size:12px;color:#92400e;line-height:1.5;">
                  ⚠️ ${warning}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">
              This is an automated security email from ${companyName} ERP. Do not reply to this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendNotification({ to, subject, html });
}

/**
 * Password reset email — thin wrapper over sendOTPEmail's PASSWORD_RESET
 * template, exposed under its own name per the requested API shape.
 */
export async function sendPasswordResetEmail(params: { to: string; firstName: string; otpCode: string; expiryMinutes?: number }): Promise<boolean> {
  return sendOTPEmail({ ...params, type: 'PASSWORD_RESET' });
}

/**
 * Generic branded system notification (platform alerts, general updates).
 */
export async function sendNotificationEmail(params: {
  to: string;
  firstName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}): Promise<boolean> {
  const { to, firstName, title, message, actionUrl, actionLabel } = params;
  const companyName = process.env.COMPANY_NAME || 'MaxHub';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${title}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${companyName} ERP</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#111827;">Hello, ${firstName},</p>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-line;">${message}</p>
            ${actionUrl ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;"><tr><td align="center"><a href="${actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 32px;border-radius:10px;">${actionLabel || 'View Details'}</a></td></tr></table>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated email from ${companyName} ERP. Do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendNotification({ to, subject: `${title} — ${companyName}`, html });
}

/**
 * Approval-style notification (leave, expense, promotion, finance/payroll
 * approvals) with a status badge — covers the various "approved/rejected"
 * emails the platform needs without a bespoke template per module.
 */
export async function sendApprovalEmail(params: {
  to: string;
  firstName: string;
  title: string;
  message: string;
  status: 'Approved' | 'Rejected' | 'Pending';
}): Promise<boolean> {
  const { to, firstName, title, message, status } = params;
  const companyName = process.env.COMPANY_NAME || 'MaxHub';
  const badge = {
    Approved: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅' },
    Rejected: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: '❌' },
    Pending: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '⏳' },
  }[status];

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${title}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${companyName} ERP</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;font-size:15px;font-weight:600;color:#111827;">Hello, ${firstName},</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${badge.bg};border:1px solid ${badge.border};border-radius:12px;margin-bottom:20px;">
              <tr><td style="padding:14px 20px;font-size:13px;font-weight:700;color:${badge.color};">${badge.icon} ${status}</td></tr>
            </table>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-line;">${message}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:18px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated email from ${companyName} ERP. Do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendNotification({ to, subject: `${title} — ${companyName}`, html });
}

/**
 * Build weekly greeting message with company name substitution
 */
export function buildWeeklyMessage(
  channel: 'Email' | 'SMS' | 'WhatsApp',
  recipient: MessageRecipient,
  companyName: string
): string {
  if (channel === 'Email') {
    return `
      <h2>Happy New Week!</h2>
      <p>Dear ${recipient.fullName},</p>
      <p>We are grateful you chose ${companyName} and we hope this week brings you great progress and exciting opportunities.</p>
      <p>We remain committed to delivering excellent service and supporting you every step of the way.</p>
      <p>Wishing you a productive and fulfilling week ahead!</p>
      <br/>
      <p>Warm regards,<br/>The ${companyName} Team</p>
    `;
  } else if (channel === 'SMS') {
    return `Hi ${recipient.fullName.split(' ')[0]}! Happy new week from ${companyName}. We are here for you - have a great week ahead!`;
  } else {
    return `*Happy New Week!* 🌟\n\nDear ${recipient.fullName.split(' ')[0]},\n\nWishing you a wonderful week from all of us at *${companyName}*. We remain committed to excellent service for you. Have a productive week! 💪`;
  }
}

/**
 * Build birthday message
 */
export function buildBirthdayMessage(
  channel: 'Email' | 'SMS' | 'WhatsApp',
  recipient: MessageRecipient,
  companyName: string
): string {
  if (channel === 'Email') {
    return `
      <h2>🎉 Happy Birthday, ${recipient.fullName.split(' ')[0]}!</h2>
      <p>Dear ${recipient.fullName},</p>
      <p>On this special day, all of us at ${companyName} want to wish you a very Happy Birthday!</p>
      <p>May this birthday bring you joy, happiness, and all the success you deserve. Thank you for being a valued part of our community.</p>
      <p>Here's to many more wonderful years ahead! 🎂</p>
      <br/>
      <p>With warm wishes,<br/>The ${companyName} Team</p>
    `;
  } else if (channel === 'SMS') {
    return `🎉 Happy Birthday ${recipient.fullName.split(' ')[0]}! Wishing you a wonderful day from all of us at ${companyName}. Enjoy your special day! 🎂`;
  } else {
    return `🎉 *Happy Birthday ${recipient.fullName.split(' ')[0]}!* 🎂\n\nWarm birthday wishes from all of us at *${companyName}*! May this special day bring you joy and all your heart desires. Enjoy! 🥳`;
  }
}
