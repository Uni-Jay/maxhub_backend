"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = sendWelcomeEmail;
exports.sendStaffCredentials = sendStaffCredentials;
exports.sendRecruitmentEmail = sendRecruitmentEmail;
exports.sendInterviewInvitation = sendInterviewInvitation;
const email_service_1 = require("./email.service");
function getHrCredentials() {
    return (0, email_service_1.resolveMailboxCredentials)('HR_EMAIL', 'HR_PASSWORD');
}
function getHrTransporter() {
    const { user, pass } = getHrCredentials();
    return (0, email_service_1.getOrCreateTransporter)(user, pass);
}
function getHrSender() {
    const { user } = getHrCredentials();
    const configured = !!process.env.HR_PASSWORD;
    return {
        name: 'MaxHub HR',
        address: configured ? (process.env.HR_FROM || process.env.HR_EMAIL || user) : (process.env.EMAIL_FROM || user),
    };
}
function welcomeEmailHtml(params) {
    const { to, firstName, employeeId, temporaryPassword, position, businessUnit, department } = params;
    const loginUrl = process.env.FRONTEND_URL || 'https://www.maxhubng.company';
    const companyName = process.env.COMPANY_NAME || 'MaxHub';
    return `<!DOCTYPE html>
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
              This is an automated email from ${companyName} HR. Please do not reply to this email.<br/>
              If you didn't expect this, contact your HR department immediately.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
async function sendWelcomeEmail(params) {
    const companyName = process.env.COMPANY_NAME || 'MaxHub';
    return (0, email_service_1.sendViaTransporter)(getHrTransporter(), getHrSender(), {
        to: params.to,
        subject: `Welcome to ${companyName} — Your Login Details`,
        html: welcomeEmailHtml(params),
    });
}
async function sendStaffCredentials(params) {
    return sendWelcomeEmail(params);
}
async function sendRecruitmentEmail(params) {
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
    return (0, email_service_1.sendViaTransporter)(getHrTransporter(), getHrSender(), { to, subject, html });
}
async function sendInterviewInvitation(params) {
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
    return (0, email_service_1.sendViaTransporter)(getHrTransporter(), getHrSender(), {
        to, subject: `Interview Invitation — ${jobTitle} at ${companyName}`, html,
    });
}
//# sourceMappingURL=hr-email.service.js.map