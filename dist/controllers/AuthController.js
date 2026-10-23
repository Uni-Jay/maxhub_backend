"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const sequelize_1 = require("sequelize");
const AuthenticationService_1 = __importDefault(require("../services/AuthenticationService"));
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const User_model_1 = require("../models/User.model");
const Session_model_1 = require("../models/Session.model");
const OTPVerification_model_1 = require("../models/OTPVerification.model");
const OTPService_1 = __importDefault(require("../services/OTPService"));
const CommunicationService_1 = require("../services/CommunicationService");
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
            const { sessionId, refreshToken } = req.body;
            await AuthenticationService_1.default.logout(sessionId, refreshToken);
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
            await AuthenticationService_1.default.disable2FA(BigInt(userId), password);
            ResponseFormatter_1.ResponseFormatter.success(res, null, '2FA disabled');
        }
        catch (error) {
            next(error);
        }
    }
    static async enable2FA(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            await AuthenticationService_1.default.enable2FA(BigInt(userId));
            ResponseFormatter_1.ResponseFormatter.success(res, null, '2FA enabled via email');
        }
        catch (error) {
            next(error);
        }
    }
    static async sendLoginOTP(req, res, next) {
        try {
            const { sessionId } = req.body;
            if (!sessionId) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'sessionId is required', 400);
                return;
            }
            await AuthenticationService_1.default.sendLoginOTP(sessionId);
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'Verification code sent');
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
            const sessions = await Session_model_1.Session.findAll({
                where: {
                    userId: BigInt(userId),
                    expiresAt: { [sequelize_1.Op.gt]: new Date() },
                },
                attributes: ['id', 'uuid', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt'],
                order: [['createdAt', 'DESC']],
            });
            ResponseFormatter_1.ResponseFormatter.success(res, sessions, 'Sessions retrieved');
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
            const session = await Session_model_1.Session.findOne({
                where: { uuid: sessionId, userId: BigInt(userId) },
            });
            if (!session) {
                ResponseFormatter_1.ResponseFormatter.notFound(res, 'Session not found');
                return;
            }
            await session.destroy();
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
            const user = await User_model_1.User.findByPk(BigInt(userId));
            if (!user) {
                ResponseFormatter_1.ResponseFormatter.notFound(res, 'User not found');
                return;
            }
            await user.update({
                firstName: firstName ?? user.firstName,
                lastName: lastName ?? user.lastName,
                phone: phone ?? user.phone,
                avatar: avatar ?? user.avatar,
            });
            ResponseFormatter_1.ResponseFormatter.success(res, {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
            }, 'Profile updated');
        }
        catch (error) {
            next(error);
        }
    }
    static async requestPasswordChangeOtp(req, res, next) {
        try {
            const { currentPassword } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            if (!currentPassword) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'currentPassword is required', 400);
                return;
            }
            const user = await User_model_1.User.findByPk(BigInt(userId));
            if (!user) {
                ResponseFormatter_1.ResponseFormatter.notFound(res, 'User not found');
                return;
            }
            const isMatch = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'Current password is incorrect', 401);
                return;
            }
            await OTPVerification_model_1.OTPVerification.update({ isUsed: true, usedAt: new Date() }, { where: { userId: user.id, type: 'PASSWORD_CHANGE', isUsed: false } });
            const otpCode = OTPService_1.default.generateOTPCode();
            const otpHash = await OTPService_1.default.hashOTP(otpCode);
            await OTPVerification_model_1.OTPVerification.create({
                userId: user.id,
                email: user.email,
                otpCode,
                otpHash,
                type: 'PASSWORD_CHANGE',
                expiresAt: OTPService_1.default.getOTPExpirationTime(),
                isUsed: false,
                attempts: 0,
            });
            (0, CommunicationService_1.sendOTPEmail)({ to: user.email, firstName: user.firstName, otpCode, type: 'PASSWORD_CHANGE' })
                .catch(err => console.error('[Auth] Password-change OTP email failed:', err));
            ResponseFormatter_1.ResponseFormatter.success(res, null, 'A confirmation code has been sent to your email');
        }
        catch (error) {
            next(error);
        }
    }
    static async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword, otpCode } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                ResponseFormatter_1.ResponseFormatter.unauthorized(res, 'Authentication required');
                return;
            }
            if (!currentPassword || !newPassword || !otpCode) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'currentPassword, newPassword, and otpCode are required', 400);
                return;
            }
            if (newPassword.length < 8) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'New password must be at least 8 characters', 400);
                return;
            }
            const user = await User_model_1.User.findByPk(BigInt(userId));
            if (!user) {
                ResponseFormatter_1.ResponseFormatter.notFound(res, 'User not found');
                return;
            }
            const isMatch = await bcrypt_1.default.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'Current password is incorrect', 401);
                return;
            }
            const otp = await OTPVerification_model_1.OTPVerification.findOne({
                where: { userId: user.id, type: 'PASSWORD_CHANGE', isUsed: false },
                order: [['createdAt', 'DESC']],
            });
            let otpValid = false;
            if (otp && otp.expiresAt >= new Date() && otp.attempts < 5) {
                otpValid = await OTPService_1.default.verifyOTP(otpCode, otp.otpHash);
                if (otpValid) {
                    await otp.update({ isUsed: true, usedAt: new Date() });
                }
                else {
                    await otp.increment('attempts');
                }
            }
            if (!otpValid) {
                ResponseFormatter_1.ResponseFormatter.error(res, 'Invalid or expired confirmation code', 401);
                return;
            }
            const hash = await bcrypt_1.default.hash(newPassword, 12);
            await user.update({ passwordHash: hash, mustChangePassword: false });
            (0, CommunicationService_1.sendPasswordChangedEmail)({ to: user.email, firstName: user.firstName, newPassword })
                .catch(err => console.error('[Auth] Password-changed confirmation email failed:', err));
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