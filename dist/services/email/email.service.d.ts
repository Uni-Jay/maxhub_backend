import { Transporter } from 'nodemailer';
export interface MailSender {
    name: string;
    address: string;
}
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: {
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }[];
}
export declare function resolveMailboxCredentials(emailVar: string, passwordVar: string): {
    user: string;
    pass: string;
};
export declare function getOrCreateTransporter(user: string, pass: string): Transporter;
export declare function sendViaTransporter(transporter: Transporter, from: MailSender, options: SendEmailOptions): Promise<boolean>;
//# sourceMappingURL=email.service.d.ts.map