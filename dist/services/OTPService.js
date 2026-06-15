"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTPService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
class OTPService {
    constructor() {
        this.otpExpiry = parseInt(process.env.OTP_EXPIRY || '600', 10);
        this.otpLength = parseInt(process.env.OTP_LENGTH || '6', 10);
        this.totpWindow = 2;
    }
    generateOTPCode() {
        const code = Math.floor(Math.random() * Math.pow(10, this.otpLength))
            .toString()
            .padStart(this.otpLength, '0');
        return code;
    }
    async hashOTP(code) {
        return bcrypt_1.default.hash(code, 10);
    }
    async verifyOTP(code, hash) {
        return bcrypt_1.default.compare(code, hash);
    }
    generateTOTPSecret(email, appName = 'MaxHub') {
        const secret = speakeasy_1.default.generateSecret({
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
    async generateQRCodeImage(otpauthUrl) {
        try {
            return await qrcode_1.default.toDataURL(otpauthUrl);
        }
        catch (error) {
            throw new Error('Failed to generate QR code');
        }
    }
    verifyTOTP(token, secret) {
        try {
            return speakeasy_1.default.totp.verify({
                secret,
                encoding: 'base32',
                token,
                window: this.totpWindow,
            });
        }
        catch (error) {
            return false;
        }
    }
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            codes.push(crypto_1.default.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
    async hashBackupCodes(codes) {
        const codeMap = codes.map((code, index) => ({
            id: index,
            code,
            used: false,
        }));
        return JSON.stringify(codeMap);
    }
    async verifyBackupCode(code, backupCodesJson, usedCodesJson) {
        try {
            const codes = JSON.parse(backupCodesJson);
            const usedCodes = usedCodesJson ? JSON.parse(usedCodesJson) : [];
            const codeEntry = codes.find((c) => c.code === code);
            if (!codeEntry)
                return { isValid: false };
            const isAlreadyUsed = usedCodes.includes(codeEntry.id);
            if (isAlreadyUsed)
                return { isValid: false };
            const newUsedCodes = [...usedCodes, codeEntry.id];
            return {
                isValid: true,
                newUsedCodes: JSON.stringify(newUsedCodes),
            };
        }
        catch (error) {
            return { isValid: false };
        }
    }
    getOTPExpirationTime() {
        return new Date(Date.now() + this.otpExpiry * 1000);
    }
    isOTPExpired(expiresAt) {
        return expiresAt < new Date();
    }
}
exports.OTPService = OTPService;
exports.default = new OTPService();
//# sourceMappingURL=OTPService.js.map