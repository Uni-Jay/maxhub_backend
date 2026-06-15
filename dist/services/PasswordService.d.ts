export interface PasswordStrengthResult {
    isStrong: boolean;
    score: number;
    feedback: string[];
}
export declare class PasswordService {
    private readonly bcryptRounds;
    private readonly minLength;
    private readonly requireUppercase;
    private readonly requireLowercase;
    private readonly requireNumbers;
    private readonly requireSpecialChars;
    constructor();
    hashPassword(password: string): Promise<string>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    checkPasswordStrength(password: string): PasswordStrengthResult;
    generateResetToken(): {
        token: string;
        hash: string;
    };
    verifyResetToken(token: string, hash: string): boolean;
    generateRandomPassword(length?: number): string;
}
declare const _default: PasswordService;
export default _default;
//# sourceMappingURL=PasswordService.d.ts.map