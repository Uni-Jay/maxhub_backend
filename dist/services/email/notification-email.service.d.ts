export interface MessageRecipient {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
}
export declare function sendMessage(channel: 'Email' | 'SMS' | 'WhatsApp', recipient: MessageRecipient, subject: string | undefined, body: string): Promise<boolean>;
export declare function sendPasswordChangedEmail(params: {
    to: string;
    firstName: string;
    newPassword: string;
}): Promise<boolean>;
export declare function sendPromotionEmail(params: {
    to: string;
    firstName: string;
    lastName: string;
    newDesignation?: string;
    newDepartment?: string;
    effectiveDate?: string | Date;
    approvalRemarks?: string;
}): Promise<boolean>;
export declare function sendBirthdayEmail(params: {
    to: string;
    fullName: string;
    type: 'staff' | 'client';
}): Promise<boolean>;
export declare function sendOTPEmail(params: {
    to: string;
    firstName: string;
    otpCode: string;
    type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | '2FA' | 'PASSWORD_CHANGE';
    expiryMinutes?: number;
}): Promise<boolean>;
export declare function sendPasswordResetEmail(params: {
    to: string;
    firstName: string;
    otpCode: string;
    expiryMinutes?: number;
}): Promise<boolean>;
export declare function sendNotificationEmail(params: {
    to: string;
    firstName: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
}): Promise<boolean>;
export declare function sendApprovalEmail(params: {
    to: string;
    firstName: string;
    title: string;
    message: string;
    status: 'Approved' | 'Rejected' | 'Pending';
}): Promise<boolean>;
export declare function buildWeeklyMessage(channel: 'Email' | 'SMS' | 'WhatsApp', recipient: MessageRecipient, companyName: string): string;
export declare function buildBirthdayMessage(channel: 'Email' | 'SMS' | 'WhatsApp', recipient: MessageRecipient, companyName: string): string;
//# sourceMappingURL=notification-email.service.d.ts.map