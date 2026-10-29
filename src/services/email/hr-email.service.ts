import { getOrCreateTransporter, sendViaTransporter, resolveMailboxCredentials, MailSender } from './email.service';

/**
 * HR-category mail: onboarding, credentials, recruitment, interviews,
 * announcements. Authenticates as HR_EMAIL/HR_PASSWORD when configured;
 * falls back to the legacy single-mailbox SMTP_USER/SMTP_PASSWORD (both
 * together, never mixed) so HR mail keeps sending — just from the old
 * address — until a real HR mailbox is provisioned in Zoho.
 */
function getHrCredentials() {
  return resolveMailboxCredentials('HR_EMAIL', 'HR_PASSWORD');
}

function getHrTransporter() {
  const { user, pass } = getHrCredentials();
  return getOrCreateTransporter(user, pass);
}

function getHrSender(): MailSender {
  // Display name follows whichever mailbox is actually authenticating —
  // showing "MaxHub HR <hr@...>" while authenticated as a different mailbox
  // that hasn't configured that alias would get rewritten or rejected by Zoho.
  const { user } = getHrCredentials();
  const configured = !!process.env.HR_PASSWORD;
  return {
    name: 'MaxHub HR',
    address: configured ? (process.env.HR_FROM || process.env.HR_EMAIL || user) : (process.env.EMAIL_FROM || user),
  };
}

export interface WelcomeEmailParams {
  to: string;
  firstName: string;
  lastName?: string;
  employeeId: string;
  /** Omit when resending without resetting the password. */
  temporaryPassword?: string;
  position?: string;
  businessUnit?: string;
  department?: string;
  /** Monthly pay, already formatted (e.g. "₦250,000.00 per month"). */
  salary?: string;
  startDate?: string;
  /** Brand that employed the staff member (primary brand). */
  brandName?: string;
  brandLogoUrl?: string;
  brandColor?: string;
  brandTagline?: string;
  /** Other brands the staff member also works for. */
  otherBrands?: string[];
  reportsTo?: string;
}

function esc(v: any): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function welcomeEmailHtml(params: WelcomeEmailParams): string {
  const { to, firstName, employeeId, temporaryPassword, position, businessUnit, department } = params;
  const loginUrl = (process.env.FRONTEND_URL || 'https://www.maxhubng.company').replace(/\/$/, '');
  const companyName = process.env.COMPANY_NAME || 'MaxHub';
  const color = params.brandColor || '#1e3a8a';
  const brand = params.brandName || companyName;
  const logoSrc = params.brandLogoUrl ? (/^https?:/.test(params.brandLogoUrl) ? params.brandLogoUrl : `${loginUrl}${params.brandLogoUrl.startsWith('/') ? '' : '/'}${params.brandLogoUrl}`) : `${loginUrl}/images/maxhublogo.jpeg`;
  const row = (label: string, value?: string, mono = false) => value ? `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f4;font-size:13px;color:#6b7280;width:150px;vertical-align:top">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eef0f4;font-size:14px;font-weight:600;color:#111827;${mono ? 'font-family:Consolas,Menlo,monospace;letter-spacing:.5px' : ''}">${value}</td></tr>` : '';
  const brandsLine = params.otherBrands?.length ? `${esc(brand)} (main)${params.otherBrands.map((b) => ` · ${esc(b)}`).join('')}` : esc(brand);

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Welcome to ${esc(brand)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 12px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
  <tr><td style="background:${color};padding:28px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle"><div style="background:#fff;display:inline-block;padding:8px 12px;border-radius:10px"><img src="${logoSrc}" alt="${esc(brand)}" style="max-height:52px;display:block" /></div></td>
      <td style="text-align:right;vertical-align:middle;color:#fff">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">Welcome aboard</div>
        <div style="font-size:20px;font-weight:700;margin-top:4px">${esc(brand)}</div>
        ${params.brandTagline ? `<div style="font-size:12px;opacity:.8">${esc(params.brandTagline)}</div>` : ''}
      </td></tr></table>
  </td></tr>
  <tr><td style="padding:36px;">
    <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">Welcome to the team, ${esc(firstName)}.</p>
    <p style="margin:0 0 26px;font-size:15px;color:#4b5563;line-height:1.65;">
      We are delighted to confirm your appointment${position ? ` as <strong>${esc(position)}</strong>` : ''} with <strong>${esc(brand)}</strong>.
      Your staff account on ${esc(companyName)}, our company workspace, is ready. Below are the details of your appointment and how to sign in.
    </p>

    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:${color};text-transform:uppercase;">Your appointment</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
      ${row('Position', esc(position))}
      ${row('Employed by', esc(brand))}
      ${row('You also work for', params.otherBrands?.length ? params.otherBrands.map(esc).join(', ') : '')}
      ${row('Department', esc(department || businessUnit))}
      ${row('Reports to', esc(params.reportsTo))}
      ${row('Monthly salary', esc(params.salary))}
      ${row('Start date', esc(params.startDate))}
      ${row('Staff ID', esc(employeeId), true)}
    </table>

    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:${color};text-transform:uppercase;">Sign-in details</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:6px 22px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row('Web address', `<a href="${loginUrl}" style="color:${color}">${loginUrl.replace(/^https?:\/\//, '')}</a>`)}
        ${row('Email', esc(to))}
        ${temporaryPassword ? row('Temporary password', `<span style="background:#fff;border:1px solid #d1d5db;border-radius:6px;padding:3px 10px">${esc(temporaryPassword)}</span>`, true) : row('Password', 'Use the password you already set, or “Forgot password” on the sign-in page.')}
      </table>
    </td></tr></table>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td align="center">
      <a href="${loginUrl}/login" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 40px;border-radius:10px;">Sign in to ${esc(companyName)}</a>
    </td></tr></table>

    <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.2px;color:${color};text-transform:uppercase;">Your first steps</p>
    <ol style="margin:0 0 24px;padding-left:18px;color:#374151;font-size:14px;line-height:1.8">
      ${temporaryPassword ? '<li>Sign in and change your temporary password straight away.</li>' : ''}
      <li>Complete your profile — photo, bank details and emergency contact.</li>
      <li>Read and sign the company policies sent to you under <em>Documents</em>.</li>
      <li>Say hello in the <em>Messages</em> channel for ${brandsLine}.</li>
    </ol>

    ${temporaryPassword ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;"><tr>
      <td style="padding:14px 18px;font-size:13px;color:#92400e;line-height:1.55;"><strong>Keep this private.</strong> The temporary password works once; you will be asked to set your own. Never share your sign-in details — HR will never ask for them.</td></tr></table>` : ''}
  </td></tr>
  <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:18px 36px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6">Sent by ${esc(brand)} HR through ${esc(companyName)}.<br/>If you did not expect this email, please contact HR.</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

/**
 * Welcome email with login credentials for a newly created staff account.
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
  const companyName = process.env.COMPANY_NAME || 'MaxHub';
  return sendViaTransporter(getHrTransporter(), getHrSender(), {
    to: params.to,
    subject: `Welcome to ${params.brandName || companyName}${params.position ? ` — ${params.position}` : ''}: your appointment and sign-in details`,
    html: welcomeEmailHtml(params),
  });
}

/**
 * Explicit "credential delivery" entry point (same content as the welcome
 * email) — kept as its own export so callers can be specific about intent
 * (e.g. resending credentials without implying a brand-new welcome).
 */
export async function sendStaffCredentials(params: WelcomeEmailParams): Promise<boolean> {
  return sendWelcomeEmail(params);
}

/**
 * Recruitment correspondence — application received, status updates, etc.
 */
export async function sendRecruitmentEmail(params: {
  to: string;
  applicantName: string;
  jobTitle: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  const { to, applicantName, jobTitle, subject, message } = params;
  const companyName = process.env.COMPANY_NAME || 'MaxHub';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${companyName} Recruitment</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Dear ${applicantName},</p>
            <p style="margin:0 0 4px;font-size:13px;color:#7c3aed;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Re: ${jobTitle}</p>
            <p style="margin:16px 0 0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-line;">${message}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated email from ${companyName} HR. Please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendViaTransporter(getHrTransporter(), getHrSender(), { to, subject, html });
}

/**
 * Interview invitation with date/time/location details.
 */
export async function sendInterviewInvitation(params: {
  to: string;
  applicantName: string;
  jobTitle: string;
  interviewDate: string;
  interviewTime: string;
  location?: string;
  interviewerName?: string;
  notes?: string;
}): Promise<boolean> {
  const { to, applicantName, jobTitle, interviewDate, interviewTime, location, interviewerName, notes } = params;
  const companyName = process.env.COMPANY_NAME || 'MaxHub';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Interview Invitation</title></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">📅 Interview Invitation</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${companyName} Recruitment</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
              Dear ${applicantName}, we'd like to invite you to an interview for the <strong>${jobTitle}</strong> position.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:12px;margin-bottom:24px;">
              <tr><td style="padding:24px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:13px;color:#6b7280;width:120px;">Date</td><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:14px;font-weight:600;color:#111827;">${interviewDate}</td></tr>
                  <tr><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:13px;color:#6b7280;">Time</td><td style="padding:8px 0;border-bottom:1px solid #e9d5ff;font-size:14px;font-weight:600;color:#111827;">${interviewTime}</td></tr>
                  ${location ? `<tr><td style="padding:8px 0;${interviewerName ? 'border-bottom:1px solid #e9d5ff;' : ''}font-size:13px;color:#6b7280;">Location</td><td style="padding:8px 0;${interviewerName ? 'border-bottom:1px solid #e9d5ff;' : ''}font-size:14px;color:#111827;">${location}</td></tr>` : ''}
                  ${interviewerName ? `<tr><td style="padding:8px 0;font-size:13px;color:#6b7280;">Interviewer</td><td style="padding:8px 0;font-size:14px;color:#111827;">${interviewerName}</td></tr>` : ''}
                </table>
              </td></tr>
            </table>
            ${notes ? `<p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">${notes}</p>` : ''}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">This is an automated email from ${companyName} HR. Please do not reply to this email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendViaTransporter(getHrTransporter(), getHrSender(), {
    to, subject: `Interview Invitation — ${jobTitle} at ${companyName}`, html,
  });
}
