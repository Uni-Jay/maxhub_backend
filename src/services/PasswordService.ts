import bcrypt from 'bcrypt';
import crypto from 'crypto';

export interface PasswordStrengthResult {
  isStrong: boolean;
  score: number; // 0-5
  feedback: string[];
}

export class PasswordService {
  private readonly bcryptRounds: number;
  private readonly minLength: number;
  private readonly requireUppercase: boolean;
  private readonly requireLowercase: boolean;
  private readonly requireNumbers: boolean;
  private readonly requireSpecialChars: boolean;

  constructor() {
    this.bcryptRounds = 12;
    this.minLength = 8;
    this.requireUppercase = true;
    this.requireLowercase = true;
    this.requireNumbers = true;
    this.requireSpecialChars = true;
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Check password strength
   */
  checkPasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
      return {
        isStrong: false,
        score: 0,
        feedback: ['Password is required'],
      };
    }

    // Length check
    if (password.length < this.minLength) {
      feedback.push(`Password must be at least ${this.minLength} characters`);
    } else {
      score++;
    }

    if (password.length >= 12) {
      score++;
    }

    // Uppercase check
    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score++;
    }

    // Lowercase check
    if (this.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score++;
    }

    // Numbers check
    if (this.requireNumbers && !/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score++;
    }

    // Special characters check
    if (this.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score++;
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Password contains too many repeated characters');
      score = Math.max(0, score - 1);
    }

    // Sequential check
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

  /**
   * Generate password reset token
   */
  generateResetToken(): { token: string; hash: string } {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  /**
   * Verify password reset token
   */
  verifyResetToken(token: string, hash: string): boolean {
    const calculatedHash = crypto.createHash('sha256').update(token).digest('hex');
    return calculatedHash === hash;
  }

  /**
   * Generate secure random password
   */
  generateRandomPassword(length: number = 16): string {
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

export default new PasswordService();
