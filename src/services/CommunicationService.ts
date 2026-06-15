import nodemailer from 'nodemailer';

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
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY,
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
