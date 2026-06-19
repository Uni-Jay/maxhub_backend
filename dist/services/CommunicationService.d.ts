export interface MessageRecipient {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
}
export declare function sendMessage(channel: 'Email' | 'SMS' | 'WhatsApp', recipient: MessageRecipient, subject: string | undefined, body: string): Promise<boolean>;
export declare function sendWelcomeEmail(params: {
    to: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    temporaryPassword: string;
    position?: string;
    businessUnit?: string;
    department?: string;
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
    type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | '2FA';
    expiryMinutes?: number;
}): Promise<boolean>;
export declare function buildWeeklyMessage(channel: 'Email' | 'SMS' | 'WhatsApp', recipient: MessageRecipient, companyName: string): string;
export declare function buildBirthdayMessage(channel: 'Email' | 'SMS' | 'WhatsApp', recipient: MessageRecipient, companyName: string): string;
//# sourceMappingURL=CommunicationService.d.ts.map