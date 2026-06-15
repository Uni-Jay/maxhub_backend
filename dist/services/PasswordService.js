"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
class PasswordService {
    constructor() {
        this.bcryptRounds = 12;
        this.minLength = 8;
        this.requireUppercase = true;
        this.requireLowercase = true;
        this.requireNumbers = true;
        this.requireSpecialChars = true;
    }
    async hashPassword(password) {
        return bcrypt_1.default.hash(password, this.bcryptRounds);
    }
    async verifyPassword(password, hash) {
        try {
            return await bcrypt_1.default.compare(password, hash);
        }
        catch (error) {
            return false;
        }
    }
    checkPasswordStrength(password) {
        const feedback = [];
        let score = 0;
        if (!password) {
            return {
                isStrong: false,
                score: 0,
                feedback: ['Password is required'],
            };
        }
        if (password.length < this.minLength) {
            feedback.push(`Password must be at least ${this.minLength} characters`);
        }
        else {
            score++;
        }
        if (password.length >= 12) {
            score++;
        }
        if (this.requireUppercase && !/[A-Z]/.test(password)) {
            feedback.push('Password must contain at least one uppercase letter');
        }
        else if (/[A-Z]/.test(password)) {
            score++;
        }
        if (this.requireLowercase && !/[a-z]/.test(password)) {
            feedback.push('Password must contain at least one lowercase letter');
        }
        else if (/[a-z]/.test(password)) {
            score++;
        }
        if (this.requireNumbers && !/\d/.test(password)) {
            feedback.push('Password must contain at least one number');
        }
        else if (/\d/.test(password)) {
            score++;
        }
        if (this.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            feedback.push('Password must contain at least one special character');
        }
        else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            score++;
        }
        if (/(.)\1{2,}/.test(password)) {
            feedback.push('Password contains too many repeated characters');
            score = Math.max(0, score - 1);
        }
        if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
            feedback.push('Password contains sequential characters');
            score = Math.max(0, score - 1);
        }
        const isStrong = score >= 4 && feedback.length === 0;
        return {
            isStrong,
            score: Math.min(5, Math.max(0, score)),
            feedback,
        };
    }
    generateResetToken() {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const hash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        return { token, hash };
    }
    verifyResetToken(token, hash) {
        const calculatedHash = crypto_1.default.createHash('sha256').update(token).digest('hex');
        return calculatedHash === hash;
    }
    generateRandomPassword(length = 16) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];
        const allChars = uppercase + lowercase + numbers + special;
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
}
exports.PasswordService = PasswordService;
exports.default = new PasswordService();
//# sourceMappingURL=PasswordService.js.map