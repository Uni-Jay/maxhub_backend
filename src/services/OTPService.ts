import bcrypt from 'bcrypt';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class OTPService {
  private readonly otpExpiry: number; // in seconds
  private readonly otpLength: number;
  private readonly totpWindow: number;

  constructor() {
    this.otpExpiry = parseInt(process.env.OTP_EXPIRY || '600', 10); // 10 minutes default
    this.otpLength = parseInt(process.env.OTP_LENGTH || '6', 10); // 6 digits default
    this.totpWindow = 2; // Allow ±1 window for time drift
  }

  /**
   * Generate random OTP code
   */
  generateOTPCode(): string {
    const code = Math.floor(Math.random() * Math.pow(10, this.otpLength))
      .toString()
      .padStart(this.otpLength, '0');
    return code;
  }

  /**
   * Hash OTP code with bcrypt
   */
  async hashOTP(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  /**
   * Verify OTP code against hash
   */
  async verifyOTP(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  /**
   * Generate TOTP secret for 2FA
   */
  generateTOTPSecret(email: string, appName: string = 'MaxHub'): {
    secret: string;
    qrCode: string;
    manualEntry: string;
  } {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${email})`,
      issuer: appName,
      length: 32,
    });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url || '',
      manualEntry: secret.base32,
    };
  }

  /**
   * Generate QR code image from OTP auth URL
   */
  async generateQRCodeImage(otpauthUrl: string): Promise<string> {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token against secret
   */
  verifyTOTP(token: string, secret: string): boolean {
    try {
      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.totpWindow,
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate backup codes for 2FA recovery
   */
  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Hash backup codes for storage
   */
  async hashBackupCodes(codes: string[]): Promise<string> {
    const codeMap = codes.map((code, index) => ({
      id: index,
      code,
      used: false,
    }));
    return JSON.stringify(codeMap);
  }

  /**
   * Verify backup code and mark as used
   */
  async verifyBackupCode(
    code: string,
    backupCodesJson: string,
    usedCodesJson?: string
  ): Promise<{ isValid: boolean; newUsedCodes?: string }> {
    try {
      const codes = JSON.parse(backupCodesJson);
      const usedCodes = usedCodesJson ? JSON.parse(usedCodesJson) : [];

      const codeEntry = codes.find((c: any) => c.code === code);
      if (!codeEntry) return { isValid: false };

      const isAlreadyUsed = usedCodes.includes(codeEntry.id);
      if (isAlreadyUsed) return { isValid: false };

      const newUsedCodes = [...usedCodes, codeEntry.id];
      return {
        isValid: true,
        newUsedCodes: JSON.stringify(newUsedCodes),
      };
    } catch (error) {
      return { isValid: false };
    }
  }

  /**
   * Calculate OTP expiration timestamp
   */
  getOTPExpirationTime(): Date {
    return new Date(Date.now() + this.otpExpiry * 1000);
  }

  /**
   * Check if OTP is expired
   */
  isOTPExpired(expiresAt: Date): boolean {
    return expiresAt < new Date();
  }
}

export default new OTPService();
