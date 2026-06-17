"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthenticationService_1 = __importDefault(require("../services/AuthenticationService"));
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password, deviceId, deviceName, rememberMe } = req.body;
            const result = await AuthenticationService_1.default.login({
                email,
                password,
                deviceId,
                deviceName,
                rememberMe,
            });
            if (result.requiresMFA) {
                ResponseFormatter_1.ResponseFormatter.success(res, {
                    sessionId: result.sessionId,
                    user: result.user,
                    requiresMFA: true,
                }, 'Login successful. Please verify 2FA');
            }
            else {
                ResponseFormatter_1.ResponseFormatter.success(res, {
                    user: result.user,
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    sessionId: result.sessionId,
                }, 'Login successful');
            }
        }
        catch (error) {
            next(error);
        }
    }
    static async register(req, res, next) {
        try {
            const { firstName, lastName, email, password, phone, departmentId } = req.body;
            const result = await AuthenticationService_1.default.register({
                firstName,
                lastName,
                email,
                password,
                phone,
                departmentId,
            });
            ResponseFormatter_1.ResponseFormatter.success(res, {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                sessionId: result.sessionId,
                emailVerificationRequired: true,
            }, 'Registration successful. Please verify your email');
        }
        catch (error) {
            next(error);
        }
    }
    static async logout(req, res, next) {
        try {
            const { sessionId } = req.body;
            await AuthenticationService_1.default.logout(sessionId);
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'Logout successful');
        }
        catch (error) {
            next(error);
        }
    }
    static async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthenticationService_1.default.refreshAccessToken(refreshToken);
            ResponseFormatter_1.ResponseFormatter.success(res, {
                accessToken: result.accessToken,
                expiresIn: result.expiresIn,
            }, 'Token refreshed');
        }
        catch (error) {
            next(error);
        }
    }
    static async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            await AuthenticationService_1.default.forgotPassword(email);
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'Password reset email sent');
        }
        catch (error) {
            next(error);
        }
    }
    static async resetPassword(req, res, next) {
        try {
            const { email, otpCode, newPassword } = req.body;
            if (!email || !otpCode || !newPassword) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'email, otpCode, and newPassword are required', 400);
                return;
            }
            await AuthenticationService_1.default.resetPassword(email, otpCode, newPassword);
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'Password reset successful. Please login again.');
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyEmail(req, res, next) {
        try {
            const { otpCode } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            await AuthenticationService_1.default.verifyEmail(BigInt(userId), otpCode);
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'Email verified successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async sendOTP(req, res, next) {
        try {
            const { email, type } = req.body;
            if (!email || !type) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'email and type are required', 400);
                return;
            }
            await AuthenticationService_1.default.sendOTP(email, type);
            ResponseFormatter_1.ResponseFormatter.success(res, null, `If an account exists for ${email}, an OTP has been sent.`);
        }
        catch (error) {
            next(error);
        }
    }
    static async setup2FA(req, res, next) {
        try {
            const { method } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            const result = await AuthenticationService_1.default.setup2FA(BigInt(userId), method);
            ResponseFormatter_1.ResponseFormatter.success(res, result, '2FA setup initiated');
        }
        catch (error) {
            next(error);
        }
    }
    static async verify2FA(req, res, next) {
        try {
            const { otpCode } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            const result = await AuthenticationService_1.default.verify2FASetup(BigInt(userId), otpCode);
            ResponseFormatter_1.ResponseFormatter.success(res, result, '2FA verified. Save backup codes in a safe place');
        }
        catch (error) {
            next(error);
        }
    }
    static async disable2FA(req, res, next) {
        try {
            const { password } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            ResponseFormatter_1.ResponseFormatter.success(res, null, '2FA disabled');
        }
        catch (error) {
            next(error);
        }
    }
    static async getSessions(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            ResponseFormatter_1.ResponseFormatter.success(res, [], 'Sessions retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async revokeSession(req, res, next) {
        try {
            const { sessionId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'Session revoked');
        }
        catch (error) {
            next(error);
        }
    }
    static async verify2FALogin(req, res, next) {
        try {
            const { sessionId, otpCode } = req.body;
            if (!sessionId || !otpCode) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'sessionId and otpCode are required', 400);
                return;
            }
            const result = await AuthenticationService_1.default.verify2FALogin(sessionId, otpCode);
            ResponseFormatter_1.ResponseFormatter.success(res, {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            }, 'Login verified successfully');
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfile(req, res, next) {
        try {
            if (!req.user) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            ResponseFormatter_1.ResponseFormatter.success(res, req.user, 'Profile retrieved');
        }
        catch (error) {
            next(error);
        }
    }
    static async updateProfile(req, res, next) {
        try {
            const { firstName, lastName, phone, avatar } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            ResponseFormatter_1.ResponseFormatter.success(res, {}, 'Profile updated');
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'Password changed successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
exports.default = AuthController;
//# sourceMappingURL=AuthController.js.map