import nodemailer from 'nodemailer';
import AIService from './AIService';

export interface MessageRecipient {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}

/**
 * Send a message via email, SMS, or WhatsApp.
 * Email uses nodemailer. SMS/WhatsApp are stubbed for provider integration.
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
      return await sendEmail(recipient.email, subject || 'Message from MaxHub', personalizedBody);
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

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  // If no SMTP config, log to console (development)
  if (!process.env.SMTP_HOST && !process.env.SENDGRID_API_KEY) {
    console.log(`[Email] To: ${to} | Subject: ${subject}`);
    console.log(`[Email] Body: ${html.substring(0, 100)}...`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@maxhub.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('[Email] Send failed:', err);
    return false;
  }
}

async function sendSMS(phone: string, message: string): Promise<boolean> {
  // Stub: integrate Twilio or similar when provider is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[SMS] To: ${phone} | Message: ${message.substring(0, 80)}...`);
    return true;
  }
  // Real Twilio integration:
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.messages.create({ body: message, to: phone, from: process.env.TWILIO_PHONE_NUMBER });
  return true;
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  // Stub: integrate WhatsApp Business API when configured
  console.log(`[WhatsApp] To: ${phone} | Message: ${message.substring(0, 80)}...`);
  return true;
}

/**
 * Send a welcome email to a newly created staff member.
 */
export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  temporaryPassword: string;
  position?: string;
  businessUnit?: string;
  department?: string;
}): Promise<boolean> {
  const { to, firstName, lastName, employeeId, temporaryPassword, position, businessUnit, department } = params;
  const loginUrl = process.env.FRONTEND_URL || 'https://www.maxhubng.company';
  const companyName = process.env.COMPANY_NAME || 'MaxHub';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${companyName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">${companyName} ERP</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Your workforce management platform</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Welcome, ${firstName}! 👋</p>
            <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
              Your staff account has been created on the ${companyName} ERP platform.
              Here are your login credentials — please keep them safe.
            </p>

            <!-- Credentials card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;margin-bottom:28px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:1px;color:#7c3aed;text-transform:uppercase;">Your Login Credentials</p>

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:13px;color:#6b7280;width:140px;">Staff ID</td>
                      <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:15px;font-weight:700;color:#4f46e5;font-family:monospace;">${employeeId}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:13px;color:#6b7280;">Email</td>
                      <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:14px;font-weight:600;color:#111827;">${to}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:13px;color:#6b7280;">Temp. Password</td>
                      <td style="padding:8px 0;border-bottom:1px solid #e9d5ff;">
                        <span style="font-family:monospace;font-size:15px;font-weight:700;color:#111827;background:#fff;border:1px solid #ddd6fe;border-radius:6px;padding:2px 10px;">${temporaryPassword}</span>
                      </td>
                    </tr>
                    ${position ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:13px;color:#6b7280;">Position</td><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:14px;color:#111827;">${position}</td></tr>` : ''}
                    ${department ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:13px;color:#6b7280;">Department</td><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:14px;color:#111827;">${department}</td></tr>` : ''}
                    ${businessUnit ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">Business Unit</td><td style="padding:8px 0;font-size:14px;color:#111827;">${businessUnit}</td></tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:10px;">
                    Sign In to MaxHub
                  </a>
                </td>
              </tr>
            </table>

            <!-- Warning -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;margin-bottom:8px;">
              <tr>
                <td style="padding:16px 20px;font-size:13px;color:#92400e;line-height:1.5;">
                  <strong>⚠️ Important:</strong> This is a temporary password. Please sign in and change it immediately.
                  Do not share your credentials with anyone.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              This is an automated email from ${companyName} ERP. Please do not reply to this email.<br/>
              If you didn't expect this, contact your HR department immediately.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendEmail(to, `Welcome to ${companyName} — Your Login Details`, html);
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

  // Generate a unique, personalised message with Claude — falls back to static if key missing
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

  return sendEmail(to, `Happy Birthday from ${companyName}! 🎂`, html);
}

/**
 * Send a branded OTP verification email.
 */
export async function sendOTPEmail(params: {
  to: string;
  firstName: string;
  otpCode: string;
  type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | '2FA';
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

  return sendEmail(to, subject, html);
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
