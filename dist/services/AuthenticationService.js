"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const User_model_1 = require("../models/User.model");
const Staff_model_1 = require("../models/Staff.model");
const StaffDepartment_model_1 = require("../models/StaffDepartment.model");
const Department_model_1 = require("../models/Department.model");
const Permission_model_1 = require("../models/Permission.model");
const Session_model_1 = require("../models/Session.model");
const OTPVerification_model_1 = require("../models/OTPVerification.model");
const TwoFactorAuth_model_1 = require("../models/TwoFactorAuth.model");
const DeviceLog_model_1 = require("../models/DeviceLog.model");
const JWTService_1 = __importDefault(require("./JWTService"));
const OTPService_1 = __importDefault(require("./OTPService"));
const PasswordService_1 = __importDefault(require("./PasswordService"));
const CommunicationService_1 = require("./CommunicationService");
const ErrorHandler_1 = require("../utils/ErrorHandler");
async function getDepartmentCodes(staffId, primaryDepartmentId) {
    const links = await StaffDepartment_model_1.StaffDepartment.findAll({ where: { staffId }, attributes: ['departmentId'] });
    const deptIds = new Set(links.map((l) => Number(l.departmentId)));
    if (primaryDepartmentId)
        deptIds.add(Number(primaryDepartmentId));
    if (!deptIds.size)
        return [];
    const depts = await Department_model_1.Department.findAll({ where: { id: [...deptIds] }, attributes: ['code'] });
    return depts.map((d) => d.code).filter(Boolean);
}
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
        const roles = await user.getRoles({
            include: [{ model: Permission_model_1.Permission, as: 'permissions' }],
        });
        const directPerms = await user.getPermissions();
        const permCodes = [
            ...new Set([
                ...roles.flatMap((r) => (r.permissions || []).map((p) => p.code)),
                ...directPerms.map((p) => p.code),
            ]),
        ];
        const staffRecord = await Staff_model_1.Staff.findOne({ where: { userId: user.id }, attributes: ['id', 'position', 'departmentId', 'phone'] });
        const departmentCodes = staffRecord ? await getDepartmentCodes(staffRecord.id, staffRecord.departmentId) : [];
        const authenticatedUser = {
            id: Number(user.id),
            uuid: user.uuid,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            departmentId: staffRecord?.departmentId ? Number(staffRecord.departmentId) : null,
            departmentUuid: user.departmentUuid || '',
            position: staffRecord?.position ?? null,
            phone: staffRecord?.phone ?? user.phone ?? null,
            roles: roles.map((r) => r.code),
            permissions: permCodes,
            mustChangePassword: !!user.mustChangePassword,
            departmentCodes,
        };
        const twoFactorAuth = await TwoFactorAuth_model_1.TwoFactorAuth.findOne({
            where: { userId: user.id, isEnabled: true },
        });
        const mfaLoginEnabled = process.env.ENABLE_2FA_LOGIN !== 'false';
        const isDemoAccount = user.email.toLowerCase().endsWith('@maxhub.com');
        const requiresMFA = mfaLoginEnabled && (!!twoFactorAuth || !isDemoAccount);
        const accessToken = JWTService_1.default.generateAccessToken(authenticatedUser);
        const refreshToken = JWTService_1.default.generateRefreshToken(authenticatedUser);
        const session = await Session_model_1.Session.create({
            userId: user.id,
            refreshToken,
            ipAddress: payload.deviceId || 'unknown',
            userAgent: deviceName || 'unknown',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        if (deviceId) {
            await DeviceLog_model_1.DeviceLog.findOrCreate({
                where: { userId: user.id, deviceId },
                defaults: {
                    userId: user.id,
                    deviceId: deviceId,
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
        if (requiresMFA) {
            const otpCode = OTPService_1.default.generateOTPCode();
            const otpHash = await OTPService_1.default.hashOTP(otpCode);
            await OTPVerification_model_1.OTPVerification.update({ isUsed: true, usedAt: new Date() }, { where: { userId: user.id, type: '2FA', isUsed: false } });
            await OTPVerification_model_1.OTPVerification.create({
                userId: user.id,
                email: user.email,
                otpCode,
                otpHash,
                type: '2FA',
                expiresAt: OTPService_1.default.getOTPExpirationTime(),
                isUsed: false,
                attempts: 0,
            });
            (0, CommunicationService_1.sendOTPEmail)({ to: user.email, firstName: user.firstName, otpCode, type: '2FA' })
                .catch(err => console.error('[Auth] 2FA email OTP send failed:', err));
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
        const staffRole = await global.db.model('Role').findOne({ where: { code: 'STAFF' } });
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
        const roles = await user.getRoles({
            include: [{ model: Permission_model_1.Permission, as: 'permissions' }],
        });
        const directPerms = await user.getPermissions();
        const permCodes = [
            ...new Set([
                ...roles.flatMap((r) => (r.permissions || []).map((p) => p.code)),
                ...directPerms.map((p) => p.code),
            ]),
        ];
        const authenticatedUser = {
            id: Number(user.id),
            uuid: user.uuid,
            email: user.email,
            name: `${firstName} ${lastName}`,
            firstName,
            lastName,
            departmentId: departmentId ? Number(departmentId) : null,
            departmentUuid: '',
            position: null,
            phone: phone ?? null,
            roles: roles.map((r) => r.code),
            permissions: permCodes,
            mustChangePassword: false,
        };
        const accessToken = JWTService_1.default.generateAccessToken(authenticatedUser);
        const refreshToken = JWTService_1.default.generateRefreshToken(authenticatedUser);
        const session = await Session_model_1.Session.create({
            userId: user.id,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        return {
            user: authenticatedUser,
            accessToken,
            refreshToken,
            requiresMFA: false,
            sessionId: session.uuid,
        };
    }
    async logout(sessionId, refreshToken) {
        if (sessionId) {
            const session = await Session_model_1.Session.findOne({ where: { uuid: sessionId } });
            if (session)
                await session.destroy();
        }
        else if (refreshToken) {
            const session = await Session_model_1.Session.findOne({ where: { refreshToken } });
            if (session)
                await session.destroy();
        }
    }
    async refreshAccessToken(refreshToken) {
        const payload = JWTService_1.default.verifyRefreshToken(refreshToken);
        if (!payload) {
            throw new ErrorHandler_1.UnauthorizedError('Invalid or expired refresh token');
        }
        const session = await Session_model_1.Session.findOne({
            where: { refreshToken },
        });
        if (!session || session.expiresAt < new Date()) {
            throw new ErrorHandler_1.UnauthorizedError('Refresh token expired');
        }
        const user = await User_model_1.User.findByPk(session.userId, {
            include: ['roles', 'permissions'],
        });
        if (!user || user.status !== 'Active') {
            throw new ErrorHandler_1.UnauthorizedError('User not found or inactive');
        }
        const roles = await user.getRoles({
            include: [{ model: Permission_model_1.Permission, as: 'permissions' }],
        });
        const directPerms = await user.getPermissions();
        const permCodes = [
            ...new Set([
                ...roles.flatMap((r) => (r.permissions || []).map((p) => p.code)),
                ...directPerms.map((p) => p.code),
            ]),
        ];
        const staffRecord = await Staff_model_1.Staff.findOne({ where: { userId: user.id }, attributes: ['id', 'position', 'departmentId', 'phone'] });
        const departmentCodes = staffRecord ? await getDepartmentCodes(staffRecord.id, staffRecord.departmentId) : [];
        const authenticatedUser = {
            id: Number(user.id),
            uuid: user.uuid,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            departmentId: staffRecord?.departmentId ? Number(staffRecord.departmentId) : null,
            departmentUuid: user.departmentUuid || '',
            position: staffRecord?.position ?? null,
            phone: staffRecord?.phone ?? user.phone ?? null,
            roles: roles.map((r) => r.code),
            permissions: permCodes,
            mustChangePassword: !!user.mustChangePassword,
            departmentCodes,
        };
        const newAccessToken = JWTService_1.default.generateAccessToken(authenticatedUser);
        await session.update({
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        return {
            accessToken: newAccessToken,
            expiresIn: 15 * 60,
        };
    }
    async forgotPassword(email) {
        const user = await User_model_1.User.findOne({ where: { email } });
        if (!user)
            return;
        await OTPVerification_model_1.OTPVerification.update({ isUsed: true, usedAt: new Date() }, { where: { userId: user.id, type: 'PASSWORD_RESET', isUsed: false } });
        const otpCode = OTPService_1.default.generateOTPCode();
        const otpHash = await OTPService_1.default.hashOTP(otpCode);
        await OTPVerification_model_1.OTPVerification.create({
            userId: user.id,
            email,
            otpCode,
            otpHash,
            type: 'PASSWORD_RESET',
            expiresAt: OTPService_1.default.getOTPExpirationTime(),
            isUsed: false,
            attempts: 0,
        });
        await (0, CommunicationService_1.sendOTPEmail)({ to: email, firstName: user.firstName, otpCode, type: 'PASSWORD_RESET' })
            .catch(err => console.error('[Auth] Password reset OTP email failed:', err));
    }
    async resetPassword(email, otpCode, newPassword) {
        const user = await User_model_1.User.findOne({ where: { email } });
        if (!user)
            throw new ErrorHandler_1.UnauthorizedError('Invalid or expired OTP');
        const otp = await OTPVerification_model_1.OTPVerification.findOne({
            where: { userId: user.id, type: 'PASSWORD_RESET', isUsed: false },
            order: [['createdAt', 'DESC']],
        });
        if (!otp || otp.expiresAt < new Date()) {
            throw new ErrorHandler_1.UnauthorizedError('OTP has expired. Please request a new code.');
        }
        if (otp.attempts >= 5) {
            throw new ErrorHandler_1.UnauthorizedError('Too many incorrect attempts. Please request a new OTP.');
        }
        const isValid = await OTPService_1.default.verifyOTP(otpCode, otp.otpHash);
        if (!isValid) {
            await otp.increment('attempts');
            const remaining = 4 - otp.attempts;
            if (remaining <= 0) {
                await otp.update({ isUsed: true });
                throw new ErrorHandler_1.UnauthorizedError('Too many incorrect attempts. Please request a new OTP.');
            }
            throw new ErrorHandler_1.UnauthorizedError(`Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
        const passwordStrength = PasswordService_1.default.checkPasswordStrength(newPassword);
        if (!passwordStrength.isStrong) {
            throw new ErrorHandler_1.ValidationError('Password is not strong enough', passwordStrength.feedback);
        }
        const passwordHash = await PasswordService_1.default.hashPassword(newPassword);
        await user.update({ passwordHash });
        await otp.update({ isUsed: true, usedAt: new Date() });
        await Session_model_1.Session.destroy({ where: { userId: user.id } });
    }
    async sendOTP(email, type) {
        if (type === 'PASSWORD_RESET') {
            return this.forgotPassword(email);
        }
        const user = await User_model_1.User.findOne({ where: { email } });
        if (!user)
            return;
        await OTPVerification_model_1.OTPVerification.update({ isUsed: true, usedAt: new Date() }, { where: { userId: user.id, type, isUsed: false } });
        const otpCode = OTPService_1.default.generateOTPCode();
        const otpHash = await OTPService_1.default.hashOTP(otpCode);
        await OTPVerification_model_1.OTPVerification.create({
            userId: user.id,
            email,
            otpCode,
            otpHash,
            type,
            expiresAt: OTPService_1.default.getOTPExpirationTime(),
            isUsed: false,
            attempts: 0,
        });
        await (0, CommunicationService_1.sendOTPEmail)({ to: email, firstName: user.firstName, otpCode, type })
            .catch(err => console.error('[Auth] OTP email failed:', err));
    }
    async verify2FALogin(sessionId, otpCode) {
        const session = await Session_model_1.Session.findOne({ where: { uuid: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            throw new ErrorHandler_1.UnauthorizedError('Session expired. Please login again.');
        }
        const user = await User_model_1.User.findByPk(session.userId, {
            include: ['roles', 'permissions'],
        });
        if (!user)
            throw new ErrorHandler_1.NotFoundError('User not found');
        const twoFA = await TwoFactorAuth_model_1.TwoFactorAuth.findOne({
            where: { userId: user.id, isEnabled: true },
        });
        let isValid = false;
        const otp = await OTPVerification_model_1.OTPVerification.findOne({
            where: { userId: user.id, type: '2FA', isUsed: false },
            order: [['createdAt', 'DESC']],
        });
        if (otp && otp.expiresAt >= new Date() && otp.attempts < 5) {
            isValid = await OTPService_1.default.verifyOTP(otpCode, otp.otpHash);
            if (isValid) {
                await otp.update({ isUsed: true, usedAt: new Date() });
            }
            else {
                await otp.increment('attempts');
            }
        }
        if (!isValid)
            throw new ErrorHandler_1.UnauthorizedError('Invalid verification code');
        if (twoFA)
            await twoFA.update({ lastUsedAt: new Date() });
        const roles = await user.getRoles({
            include: [{ model: Permission_model_1.Permission, as: 'permissions' }],
        });
        const directPerms = await user.getPermissions();
        const permCodes = [
            ...new Set([
                ...roles.flatMap((r) => (r.permissions || []).map((p) => p.code)),
                ...directPerms.map((p) => p.code),
            ]),
        ];
        const staffRecord = await Staff_model_1.Staff.findOne({ where: { userId: user.id }, attributes: ['id', 'position', 'departmentId', 'phone'] });
        const departmentCodes = staffRecord ? await getDepartmentCodes(staffRecord.id, staffRecord.departmentId) : [];
        const authenticatedUser = {
            id: Number(user.id),
            uuid: user.uuid,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            departmentId: staffRecord?.departmentId ? Number(staffRecord.departmentId) : null,
            departmentUuid: user.departmentUuid || '',
            position: staffRecord?.position ?? null,
            phone: staffRecord?.phone ?? user.phone ?? null,
            roles: roles.map((r) => r.code),
            permissions: permCodes,
            mustChangePassword: !!user.mustChangePassword,
            departmentCodes,
        };
        const accessToken = JWTService_1.default.generateAccessToken(authenticatedUser);
        const refreshToken = JWTService_1.default.generateRefreshToken(authenticatedUser);
        await session.update({ refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
        return { accessToken, refreshToken, user: authenticatedUser };
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
    async enable2FA(userId) {
        const user = await User_model_1.User.findByPk(userId);
        if (!user)
            throw new ErrorHandler_1.NotFoundError('User not found');
        await TwoFactorAuth_model_1.TwoFactorAuth.update({ isEnabled: false }, { where: { userId } });
        await TwoFactorAuth_model_1.TwoFactorAuth.findOrCreate({
            where: { userId, method: 'EMAIL' },
            defaults: {
                userId,
                method: 'EMAIL',
                isEnabled: true,
                isVerified: true,
                verifiedAt: new Date(),
            },
        }).then(async ([record, created]) => {
            if (!created) {
                await record.update({ isEnabled: true, isVerified: true, verifiedAt: new Date() });
            }
        });
    }
    async disable2FA(userId, password) {
        const user = await User_model_1.User.findByPk(userId);
        if (!user)
            throw new ErrorHandler_1.NotFoundError('User not found');
        if (password) {
            const isValid = await PasswordService_1.default.verifyPassword(password, user.passwordHash);
            if (!isValid)
                throw new ErrorHandler_1.UnauthorizedError('Incorrect password');
        }
        await TwoFactorAuth_model_1.TwoFactorAuth.update({ isEnabled: false }, { where: { userId } });
    }
    async sendLoginOTP(sessionId) {
        const session = await Session_model_1.Session.findOne({ where: { uuid: sessionId } });
        if (!session || session.expiresAt < new Date()) {
            throw new ErrorHandler_1.UnauthorizedError('Session expired. Please login again.');
        }
        const user = await User_model_1.User.findByPk(session.userId);
        if (!user)
            throw new ErrorHandler_1.NotFoundError('User not found');
        const twoFA = await TwoFactorAuth_model_1.TwoFactorAuth.findOne({ where: { userId: user.id, isEnabled: true } });
        if (!twoFA) {
            throw new ErrorHandler_1.ValidationError('2FA not configured for this account', []);
        }
        await OTPVerification_model_1.OTPVerification.update({ isUsed: true, usedAt: new Date() }, { where: { userId: user.id, type: '2FA', isUsed: false } });
        const otpCode = OTPService_1.default.generateOTPCode();
        const otpHash = await OTPService_1.default.hashOTP(otpCode);
        await OTPVerification_model_1.OTPVerification.create({
            userId: user.id,
            email: user.email,
            otpCode,
            otpHash,
            type: '2FA',
            expiresAt: OTPService_1.default.getOTPExpirationTime(),
            isUsed: false,
            attempts: 0,
        });
        await (0, CommunicationService_1.sendOTPEmail)({ to: user.email, firstName: user.firstName, otpCode, type: '2FA' })
            .catch(err => console.error('[Auth] 2FA resend OTP failed:', err));
    }
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();
//# sourceMappingURL=AuthenticationService.js.map