export interface LoginPayload {
    email: string;
    password: string;
    deviceId?: string;
    deviceName?: string;
    rememberMe?: boolean;
}
export interface LoginResponse {
    user: any;
    accessToken: string;
    refreshToken: string;
    requiresMFA: boolean;
    sessionId: string;
}
export interface RegistrationPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    departmentId?: bigint;
}
export declare class AuthenticationService {
    login(payload: LoginPayload): Promise<LoginResponse>;
    register(payload: RegistrationPayload): Promise<LoginResponse>;
    logout(sessionId: string): Promise<void>;
    refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        expiresIn: number;
    }>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(email: string, otpCode: string, newPassword: string): Promise<void>;
    sendOTP(email: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | '2FA'): Promise<void>;
    verify2FALogin(sessionId: string, otpCode: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    verifyEmail(userId: bigint, otpCode: string): Promise<void>;
    setup2FA(userId: bigint, method: 'TOTP' | 'SMS' | 'EMAIL'): Promise<{
        secret?: string;
        qrCode?: string;
        message: string;
    }>;
    verify2FASetup(userId: bigint, otpCode: string): Promise<{
        backupCodes: string[];
    }>;
}
declare const _default: AuthenticationService;
export default _default;
//# sourceMappingURL=AuthenticationService.d.ts.map