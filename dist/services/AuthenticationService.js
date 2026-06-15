"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const User_model_1 = require("@models/User.model");
const Session_model_1 = require("@models/Session.model");
const OTPVerification_model_1 = require("@models/OTPVerification.model");
const TwoFactorAuth_model_1 = require("@models/TwoFactorAuth.model");
const DeviceLog_model_1 = require("@models/DeviceLog.model");
const PasswordReset_model_1 = require("@models/PasswordReset.model");
const JWTService_1 = __importDefault(require("./JWTService"));
const OTPService_1 = __importDefault(require("./OTPService"));
const PasswordService_1 = __importDefault(require("./PasswordService"));
const ErrorHandler_1 = require("@utils/ErrorHandler");
class AuthenticationService {
    async login(payload) {
        const { email, password, deviceId, deviceName, rememberMe } = payload;
        const user = await User_model_1.User.findOne({
            where: { email },
            include: ['roles', 'permissions'],
        });
        if (!user) {
            throw new ErrorHandler_1.UnauthorizedError('Invalid credentials');
        }
        if (user.status !== 'Active') {
            throw new ErrorHandler_1.ForbiddenError('User account is not active');
        }
        const isPasswordValid = await PasswordService_1.default.verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
            const attempts = (user.loginAttempts || 0) + 1;
            const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
            await user.update({
                loginAttempts: attempts,
                lockedUntil: lockedUntil,
            });
            throw new ErrorHandler_1.UnauthorizedError('Invalid credentials');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new ErrorHandler_1.ForbiddenError('Account is locked. Try again later.');
        }
        await user.update({
            loginAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
        });
        const roles = await user.getRoles();
        const permissions = await user.getPermissions();
        const authenticatedUser = {
            id: Number(user.id),
            uuid: user.uuid,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            departmentId: user.departmentId ? Number(user.departmentId) : null,
            roles: roles.map((r) => r.name),
            permissions: permissions.map((p) => p.code),
        };
        const twoFactorAuth = await TwoFactorAuth_model_1.TwoFactorAuth.findOne({
            where: { userId: user.id, isEnabled: true },
        });
        const requiresMFA = !!twoFactorAuth;
        const accessToken = JWTService_1.default.generateAccessToken(authenticatedUser);
        const refreshToken = JWTService_1.default.generateRefreshToken(authenticatedUser);
        const session = await Session_model_1.Session.create({
            userId: user.id,
            token: accessToken,
            refreshToken,
            deviceId: deviceId || 'unknown',
            ipAddress: payload.deviceId,
            userAgent: deviceName || 'unknown',
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isActive: true,
            lastActivityAt: new Date(),
        });
        if (deviceId) {
            await DeviceLog_model_1.DeviceLog.findOrCreate({
                where: { userId: user.id, deviceId },
                defaults: {
                    deviceName: deviceName,
                    deviceType: 'unknown',
                    ipAddress: payload.deviceId || 'unknown',
                    userAgent: deviceName || 'unknown',
                    isVerified: false,
                    lastActivityAt: new Date(),
                    isTrusted: false,
                },
            });
        }
        return {
            user: authenticatedUser,
            accessToken,
            refreshToken,
            requiresMFA,
            sessionId: session.uuid,
        };
    }
    async register(payload) {
        const { firstName, lastName, email, password, phone, departmentId } = payload;
        const existingUser = await User_model_1.User.findOne({ where: { email } });
        if (existingUser) {
            throw new ErrorHandler_1.ConflictError('Email already registered');
        }
        const passwordStrength = PasswordService_1.default.checkPasswordStrength(password);
        if (!passwordStrength.isStrong) {
            throw new ErrorHandler_1.ValidationError('Password is not strong enough', passwordStrength.feedback);
        }
        const passwordHash = await PasswordService_1.default.hashPassword(password);
        const user = await User_model_1.User.create({
            firstName,
            lastName,
            email,
            phone,
            passwordHash,
            departmentId: departmentId ? BigInt(departmentId) : null,
            status: 'Active',
            emailVerified: false,
            loginAttempts: 0,
        });
        const staffRole = await global.db.model('Role').findOne({ where: { name: 'STAFF' } });
        if (staffRole) {
            await user.addRole(staffRole);
        }
        const otpCode = OTPService_1.default.generateOTPCode();
        const otpHash = await OTPService_1.default.hashOTP(otpCode);
        await OTPVerification_model_1.OTPVerification.create({
            userId: user.id,
            email,
            otpCode,
            otpHash,
            type: 'EMAIL_VERIFICATION',
            expiresAt: OTPService_1.default.getOTPExpirationTime(),
            isUsed: false,
            attempts: 0,
        });
        const roles = await user.getRoles();
        const permissions = await user.getPermissions();
        const authenticatedUser = {
            id: Number(user.id),
            uuid: user.uuid,
            email: user.email,
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            departmentId: departmentId ? Number(departmentId) : null,
            roles: roles.map((r) => r.name),
            permissions: permissions.map((p) => p.code),
        };
        const accessToken = JWTService_1.default.generateAccessToken(authenticatedUser);
        const refreshToken = JWTService_1.default.generateRefreshToken(authenticatedUser);
        const session = await Session_model_1.Session.create({
            userId: user.id,
            token: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isActive: true,
            lastActivityAt: new Date(),
        });
        return {
            user: authenticatedUser,
            accessToken,
            refreshToken,
            requiresMFA: false,
            sessionId: session.uuid,
        };
    }
    async logout(sessionId) {
        const session = await Session_model_1.Session.findOne({ where: { uuid: sessionId } });
        if (session) {
            await session.update({
                isActive: false,
                revokedAt: new Date(),
            });
        }
    }
    async refreshAccessToken(refreshToken) {
        const payload = JWTService_1.default.verifyRefreshToken(refreshToken);
        if (!payload) {
            throw new ErrorHandler_1.UnauthorizedError('Invalid or expired refresh token');
        }
        const session = await Session_model_1.Session.findOne({
            where: { refreshToken, isActive: true },
        });
        if (!session || session.refreshExpiresAt < new Date()) {
            throw new ErrorHandler_1.UnauthorizedError('Refresh token expired');
        }
        const user = await User_model_1.User.findByPk(session.userId, {
            include: ['roles', 'permissions'],
        });
        if (!user || user.status !== 'Active') {
            throw new ErrorHandler_1.UnauthorizedError('User not found or inactive');
        }
        const roles = await user.getRoles();
        const permissions = await user.getPermissions();
        const authenticatedUser = {
            id: Number(user.id),
            uuid: user.uuid,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            departmentId: user.departmentId ? Number(user.departmentId) : null,
            roles: roles.map((r) => r.name),
            permissions: permissions.map((p) => p.code),
        };
        const newAccessToken = JWTService_1.default.generateAccessToken(authenticatedUser);
        await session.update({
            token: newAccessToken,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            lastActivityAt: new Date(),
        });
        return {
            accessToken: newAccessToken,
            expiresIn: 15 * 60,
        };
    }
    async forgotPassword(email) {
        const user = await User_model_1.User.findOne({ where: { email } });
        if (!user) {
            return;
        }
        const { token, hash } = PasswordService_1.default.generateResetToken();
        await PasswordReset_model_1.PasswordReset.create({
            userId: user.id,
            email,
            token,
            tokenHash: hash,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
            isUsed: false,
        });
    }
    async resetPassword(token, newPassword) {
        const reset = await PasswordReset_model_1.PasswordReset.findOne({
            where: { isUsed: false },
        });
        if (!reset || reset.expiresAt < new Date()) {
            throw new ErrorHandler_1.UnauthorizedError('Invalid or expired reset token');
        }
        const isTokenValid = PasswordService_1.default.verifyResetToken(token, reset.tokenHash);
        if (!isTokenValid) {
            throw new ErrorHandler_1.UnauthorizedError('Invalid reset token');
        }
        const passwordStrength = PasswordService_1.default.checkPasswordStrength(newPassword);
        if (!passwordStrength.isStrong) {
            throw new ErrorHandler_1.ValidationError('Password is not strong enough', passwordStrength.feedback);
        }
        const user = await User_model_1.User.findByPk(reset.userId);
        if (!user) {
            throw new ErrorHandler_1.NotFoundError('User not found');
        }
        const passwordHash = await PasswordService_1.default.hashPassword(newPassword);
        await user.update({ passwordHash });
        await reset.update({
            isUsed: true,
            usedAt: new Date(),
        });
        await Session_model_1.Session.update({ isActive: false, revokedAt: new Date() }, { where: { userId: user.id } });
    }
    async verifyEmail(userId, otpCode) {
        const otp = await OTPVerification_model_1.OTPVerification.findOne({
            where: {
                userId,
                type: 'EMAIL_VERIFICATION',
                isUsed: false,
            },
        });
        if (!otp || otp.expiresAt < new Date()) {
            throw new ErrorHandler_1.UnauthorizedError('OTP expired');
        }
        const isValid = await OTPService_1.default.verifyOTP(otpCode, otp.otpHash);
        if (!isValid) {
            await otp.increment('attempts');
            if (otp.attempts >= 5) {
                await otp.update({ isUsed: true });
            }
            throw new ErrorHandler_1.UnauthorizedError('Invalid OTP');
        }
        await otp.update({
            isUsed: true,
            usedAt: new Date(),
        });
        const user = await User_model_1.User.findByPk(userId);
        if (user) {
            await user.update({
                emailVerified: true,
                emailVerifiedAt: new Date(),
            });
        }
    }
    async setup2FA(userId, method) {
        const existing = await TwoFactorAuth_model_1.TwoFactorAuth.findOne({
            where: { userId, isEnabled: true },
        });
        if (existing) {
            throw new ErrorHandler_1.ConflictError('Two-factor authentication already enabled');
        }
        if (method === 'TOTP') {
            const user = await User_model_1.User.findByPk(userId);
            if (!user)
                throw new ErrorHandler_1.NotFoundError('User not found');
            const { secret, qrCode, manualEntry } = OTPService_1.default.generateTOTPSecret(user.email);
            const qrCodeImage = await OTPService_1.default.generateQRCodeImage(qrCode);
            await TwoFactorAuth_model_1.TwoFactorAuth.create({
                userId,
                method: 'TOTP',
                secret,
                qrCode: qrCodeImage,
                isEnabled: false,
                isVerified: false,
            });
            return {
                secret: manualEntry,
                qrCode: qrCodeImage,
                message: 'Scan the QR code with your authenticator app',
            };
        }
        else if (method === 'SMS') {
            const user = await User_model_1.User.findByPk(userId);
            if (!user || !user.phone) {
                throw new ErrorHandler_1.ValidationError('Phone number not provided', ['Phone number required for SMS 2FA']);
            }
            await TwoFactorAuth_model_1.TwoFactorAuth.create({
                userId,
                method: 'SMS',
                phoneNumber: user.phone,
                isEnabled: false,
                isVerified: false,
            });
            return {
                message: 'SMS 2FA setup initiated. Verify with OTP sent to your phone',
            };
        }
        throw new ErrorHandler_1.ValidationError('Invalid 2FA method', ['Only TOTP and SMS are supported']);
    }
    async verify2FASetup(userId, otpCode) {
        const twoFactor = await TwoFactorAuth_model_1.TwoFactorAuth.findOne({
            where: { userId, isVerified: false },
        });
        if (!twoFactor) {
            throw new ErrorHandler_1.NotFoundError('2FA setup not found');
        }
        if (twoFactor.method === 'TOTP' && twoFactor.secret) {
            const isValid = OTPService_1.default.verifyTOTP(otpCode, twoFactor.secret);
            if (!isValid) {
                throw new ErrorHandler_1.UnauthorizedError('Invalid OTP');
            }
        }
        const backupCodes = OTPService_1.default.generateBackupCodes(10);
        const backupCodesHash = await OTPService_1.default.hashBackupCodes(backupCodes);
        await twoFactor.update({
            isEnabled: true,
            isVerified: true,
            verifiedAt: new Date(),
            backupCodes: backupCodesHash,
        });
        return { backupCodes };
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();
//# sourceMappingURL=AuthenticationService.js.map