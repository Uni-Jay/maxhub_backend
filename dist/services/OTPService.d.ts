export declare class OTPService {
    private readonly otpExpiry;
    private readonly otpLength;
    private readonly totpWindow;
    constructor();
    generateOTPCode(): string;
    hashOTP(code: string): Promise<string>;
    verifyOTP(code: string, hash: string): Promise<boolean>;
    generateTOTPSecret(email: string, appName?: string): {
        secret: string;
        qrCode: string;
        manualEntry: string;
    };
    generateQRCodeImage(otpauthUrl: string): Promise<string>;
    verifyTOTP(token: string, secret: string): boolean;
    generateBackupCodes(count?: number): string[];
    hashBackupCodes(codes: string[]): Promise<string>;
    verifyBackupCode(code: string, backupCodesJson: string, usedCodesJson?: string): Promise<{
        isValid: boolean;
        newUsedCodes?: string;
    }>;
    getOTPExpirationTime(): Date;
    isOTPExpired(expiresAt: Date): boolean;
}
declare const _default: OTPService;
export default _default;
//# sourceMappingURL=OTPService.d.ts.map