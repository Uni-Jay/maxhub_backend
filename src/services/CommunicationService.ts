/**
 * Backward-compatible re-export shim. The actual mail-sending
 * implementation now lives under ./email/ (split by sender mailbox: HR vs
 * general/notification) — every existing `import ... from
 * '@services/CommunicationService'` across the codebase keeps working
 * unchanged.
 */
export {
  sendWelcomeEmail,
  sendStaffCredentials,
  sendRecruitmentEmail,
  sendInterviewInvitation,
} from './email/hr-email.service';

export {
  MessageRecipient,
  sendMessage,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendPromotionEmail,
  sendBirthdayEmail,
  sendNotificationEmail,
  sendApprovalEmail,
  sendProposalEmail,
  buildWeeklyMessage,
  buildBirthdayMessage,
} from './email/notification-email.service';
