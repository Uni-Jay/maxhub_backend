import { User } from '@models/User.model';
import { Permission } from '@models/Permission.model';
import { Session } from '@models/Session.model';
import { OTPVerification } from '@models/OTPVerification.model';
import { TwoFactorAuth } from '@models/TwoFactorAuth.model';
import { DeviceLog } from '@models/DeviceLog.model';
import { PasswordReset } from '@models/PasswordReset.model';
import JWTService from './JWTService';
import OTPService from './OTPService';
import PasswordService from './PasswordService';
import RBACService from './RBACService';
import { sendOTPEmail } from './CommunicationService';
import { PermissionCode } from '@config/PermissionCodes';
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '@utils/ErrorHandler';

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

export class AuthenticationService {
  /**
   * Authenticate user and generate session
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { email, password, deviceId, deviceName, rememberMe } = payload;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: ['roles', 'permissions'],
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== 'Active') {
      throw new ForbiddenError('User account is not active');
    }

    // Verify password
    const isPasswordValid = await PasswordService.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment login attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await user.update({
        loginAttempts: attempts,
        lockedUntil: lockedUntil as any,
      });

      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenError('Account is locked. Try again later.');
    }

    // Reset login attempts on successful login
    await user.update({
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });

    // Get user roles (with their permissions) + any direct user permissions
    const roles = await user.getRoles({
      include: [{ model: Permission, as: 'permissions' }],
    });
    const directPerms = await user.getPermissions();
    const permCodes = [
      ...new Set([
        ...roles.flatMap((r: any) => (r.permissions || []).map((p: any) => p.code)),
        ...directPerms.map((p: any) => p.code),
      ]),
    ];

    const authenticatedUser = {
      id: Number(user.id),
      uuid: user.uuid,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId ? Number(user.departmentId) : null,
      roles: roles.map((r: any) => r.code),
      permissions: permCodes,
    };

    // Check if 2FA is enabled
    const twoFactorAuth = await TwoFactorAuth.findOne({
      where: { userId: user.id, isEnabled: true },
    });

    const requiresMFA = !!twoFactorAuth;

    // Generate tokens
    const accessToken = JWTService.generateAccessToken(authenticatedUser);
    const refreshToken = JWTService.generateRefreshToken(authenticatedUser);

    // Create session
    const session = await Session.create({
      userId: user.id,
      token: accessToken,
      refreshToken,
      deviceId: deviceId || 'unknown',
      ipAddress: payload.deviceId, // In real app, get from request context
      userAgent: deviceName || 'unknown',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      refreshExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
      lastActivityAt: new Date(),
    });

    // Track device
    if (deviceId) {
      await DeviceLog.findOrCreate({
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

    // If EMAIL-based 2FA, generate and send an OTP now
    if (requiresMFA && twoFactorAuth?.method === 'EMAIL') {
      const otpCode = OTPService.generateOTPCode();
      const otpHash = await OTPService.hashOTP(otpCode);
      await OTPVerification.update(
        { isUsed: true, usedAt: new Date() },
        { where: { userId: user.id, type: '2FA', isUsed: false } }
      );
      await OTPVerification.create({
        userId: user.id,
        email: user.email,
        otpCode,
        otpHash,
        type: '2FA',
        expiresAt: OTPService.getOTPExpirationTime(),
        isUsed: false,
        attempts: 0,
      });
      sendOTPEmail({ to: user.email, firstName: user.firstName, otpCode, type: '2FA' })
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

  /**
   * Register new user
   */
  async register(payload: RegistrationPayload): Promise<LoginResponse> {
    const { firstName, lastName, email, password, phone, departmentId } = payload;

    // Check if email exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Validate password strength
    const passwordStrength = PasswordService.checkPasswordStrength(password);
    if (!passwordStrength.isStrong) {
      throw new ValidationError('Password is not strong enough', passwordStrength.feedback);
    }

    // Hash password
    const passwordHash = await PasswordService.hashPassword(password);

    // Create user with default role (STAFF)
    const user = await User.create({
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

    // Assign default role
    const staffRole = await (global as any).db.model('Role').findOne({ where: { code: 'STAFF' } });
    if (staffRole) {
      await user.addRole(staffRole);
    }

    // Send email verification OTP
    const otpCode = OTPService.generateOTPCode();
    const otpHash = await OTPService.hashOTP(otpCode);

    await OTPVerification.create({
      userId: user.id,
      email,
      otpCode,
      otpHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt: OTPService.getOTPExpirationTime(),
      isUsed: false,
      attempts: 0,
    });

    // In real app, send email with OTP code
    // await EmailService.sendVerificationEmail(email, otpCode);

    // Auto-login and require email verification
    const roles = await user.getRoles({
      include: [{ model: Permission, as: 'permissions' }],
    });
    const directPerms = await user.getPermissions();
    const permCodes = [
      ...new Set([
        ...roles.flatMap((r: any) => (r.permissions || []).map((p: any) => p.code)),
        ...directPerms.map((p: any) => p.code),
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
      roles: roles.map((r: any) => r.code),
      permissions: permCodes,
    };

    const accessToken = JWTService.generateAccessToken(authenticatedUser);
    const refreshToken = JWTService.generateRefreshToken(authenticatedUser);

    const session = await Session.create({
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

  /**
   * Logout and revoke session
   */
  async logout(sessionId: string): Promise<void> {
    const session = await Session.findOne({ where: { uuid: sessionId } });

    if (session) {
      await session.update({
        isActive: false,
        revokedAt: new Date(),
      });
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    // Verify refresh token
    const payload = JWTService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Find session
    const session = await Session.findOne({
      where: { refreshToken, isActive: true },
    });

    if (!session || session.refreshExpiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Get user
    const user = await User.findByPk(session.userId, {
      include: ['roles', 'permissions'],
    });

    if (!user || user.status !== 'Active') {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Generate new access token
    const roles = await user.getRoles({
      include: [{ model: Permission, as: 'permissions' }],
    });
    const directPerms = await user.getPermissions();
    const permCodes = [
      ...new Set([
        ...roles.flatMap((r: any) => (r.permissions || []).map((p: any) => p.code)),
        ...directPerms.map((p: any) => p.code),
      ]),
    ];

    const authenticatedUser = {
      id: Number(user.id),
      uuid: user.uuid,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId ? Number(user.departmentId) : null,
      roles: roles.map((r: any) => r.code),
      permissions: permCodes,
    };

    const newAccessToken = JWTService.generateAccessToken(authenticatedUser);

    // Update session
    await session.update({
      token: newAccessToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      lastActivityAt: new Date(),
    });

    return {
      accessToken: newAccessToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Generate and email a 6-digit OTP for password reset
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user) return; // Security: don't reveal whether the email exists

    // Expire any previous unused PASSWORD_RESET OTPs for this user
    await OTPVerification.update(
      { isUsed: true, usedAt: new Date() },
      { where: { userId: user.id, type: 'PASSWORD_RESET', isUsed: false } }
    );

    const otpCode = OTPService.generateOTPCode();
    const otpHash = await OTPService.hashOTP(otpCode);

    await OTPVerification.create({
      userId: user.id,
      email,
      otpCode,
      otpHash,
      type: 'PASSWORD_RESET',
      expiresAt: OTPService.getOTPExpirationTime(),
      isUsed: false,
      attempts: 0,
    });

    await sendOTPEmail({ to: email, firstName: user.firstName, otpCode, type: 'PASSWORD_RESET' })
      .catch(err => console.error('[Auth] Password reset OTP email failed:', err));
  }

  /**
   * Reset password by verifying the emailed OTP code
   */
  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid or expired OTP');

    const otp = await OTPVerification.findOne({
      where: { userId: user.id, type: 'PASSWORD_RESET', isUsed: false },
      order: [['createdAt', 'DESC']],
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedError('OTP has expired. Please request a new code.');
    }

    if (otp.attempts >= 5) {
      throw new UnauthorizedError('Too many incorrect attempts. Please request a new OTP.');
    }

    const isValid = await OTPService.verifyOTP(otpCode, otp.otpHash);
    if (!isValid) {
      await otp.increment('attempts');
      const remaining = 4 - otp.attempts;
      if (remaining <= 0) {
        await otp.update({ isUsed: true });
        throw new UnauthorizedError('Too many incorrect attempts. Please request a new OTP.');
      }
      throw new UnauthorizedError(
        `Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
      );
    }

    const passwordStrength = PasswordService.checkPasswordStrength(newPassword);
    if (!passwordStrength.isStrong) {
      throw new ValidationError('Password is not strong enough', passwordStrength.feedback);
    }

    const passwordHash = await PasswordService.hashPassword(newPassword);
    await user.update({ passwordHash });

    await otp.update({ isUsed: true, usedAt: new Date() });

    // Soft-delete (paranoid) all sessions so user must log in again
    await Session.destroy({ where: { userId: user.id } });
  }

  /**
   * Send an OTP email for any supported type (wrapper used by sendOTP controller)
   */
  async sendOTP(email: string, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | '2FA'): Promise<void> {
    if (type === 'PASSWORD_RESET') {
      return this.forgotPassword(email);
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return;

    await OTPVerification.update(
      { isUsed: true, usedAt: new Date() },
      { where: { userId: user.id, type, isUsed: false } }
    );

    const otpCode = OTPService.generateOTPCode();
    const otpHash = await OTPService.hashOTP(otpCode);

    await OTPVerification.create({
      userId: user.id,
      email,
      otpCode,
      otpHash,
      type,
      expiresAt: OTPService.getOTPExpirationTime(),
      isUsed: false,
      attempts: 0,
    });

    await sendOTPEmail({ to: email, firstName: user.firstName, otpCode, type })
      .catch(err => console.error('[Auth] OTP email failed:', err));
  }

  /**
   * Verify MFA code after login and return tokens
   */
  async verify2FALogin(sessionId: string, otpCode: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    const session = await Session.findOne({ where: { uuid: sessionId } });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedError('Session expired. Please login again.');
    }

    const user = await User.findByPk(session.userId, {
      include: ['roles', 'permissions'],
    });
    if (!user) throw new NotFoundError('User not found');

    const twoFA = await TwoFactorAuth.findOne({
      where: { userId: user.id, isEnabled: true },
    });
    if (!twoFA) throw new UnauthorizedError('2FA not configured for this account');

    let isValid = false;

    if (twoFA.method === 'TOTP' && twoFA.secret) {
      isValid = OTPService.verifyTOTP(otpCode, twoFA.secret);
    } else if (twoFA.method === 'EMAIL') {
      const otp = await OTPVerification.findOne({
        where: { userId: user.id, type: '2FA', isUsed: false },
        order: [['createdAt', 'DESC']],
      });
      if (otp && otp.expiresAt >= new Date() && otp.attempts < 5) {
        isValid = await OTPService.verifyOTP(otpCode, otp.otpHash);
        if (isValid) {
          await otp.update({ isUsed: true, usedAt: new Date() });
        } else {
          await otp.increment('attempts');
        }
      }
    }

    if (!isValid) throw new UnauthorizedError('Invalid verification code');

    await twoFA.update({ lastUsedAt: new Date() });

    // Re-build user payload and issue fresh tokens
    const roles = await user.getRoles({
      include: [{ model: Permission, as: 'permissions' }],
    });
    const directPerms = await user.getPermissions();
    const permCodes = [
      ...new Set([
        ...roles.flatMap((r: any) => (r.permissions || []).map((p: any) => p.code)),
        ...directPerms.map((p: any) => p.code),
      ]),
    ];

    const authenticatedUser = {
      id: Number(user.id),
      uuid: user.uuid,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId: user.departmentId ? Number(user.departmentId) : null,
      roles: roles.map((r: any) => r.code),
      permissions: permCodes,
    };

    const accessToken = JWTService.generateAccessToken(authenticatedUser);
    const refreshToken = JWTService.generateRefreshToken(authenticatedUser);

    await session.update({ refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });

    return { accessToken, refreshToken, user: authenticatedUser };
  }

  /**
   * Verify email with OTP
   */
  async verifyEmail(userId: bigint, otpCode: string): Promise<void> {
    const otp = await OTPVerification.findOne({
      where: {
        userId,
        type: 'EMAIL_VERIFICATION',
        isUsed: false,
      },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedError('OTP expired');
    }

    // Verify OTP
    const isValid = await OTPService.verifyOTP(otpCode, otp.otpHash);
    if (!isValid) {
      await otp.increment('attempts');
      if (otp.attempts >= 5) {
        await otp.update({ isUsed: true });
      }
      throw new UnauthorizedError('Invalid OTP');
    }

    // Mark OTP as used
    await otp.update({
      isUsed: true,
      usedAt: new Date(),
    });

    // Mark email as verified
    const user = await User.findByPk(userId);
    if (user) {
      await user.update({
        emailVerified: true,
        emailVerifiedAt: new Date(),
      });
    }
  }

  /**
   * Setup 2FA
   */
  async setup2FA(
    userId: bigint,
    method: 'TOTP' | 'SMS' | 'EMAIL'
  ): Promise<{ secret?: string; qrCode?: string; message: string }> {
    // Check if already has 2FA
    const existing = await TwoFactorAuth.findOne({
      where: { userId, isEnabled: true },
    });

    if (existing) {
      throw new ConflictError('Two-factor authentication already enabled');
    }

    if (method === 'TOTP') {
      const user = await User.findByPk(userId);
      if (!user) throw new NotFoundError('User not found');

      const { secret, qrCode, manualEntry } = OTPService.generateTOTPSecret(user.email);
      const qrCodeImage = await OTPService.generateQRCodeImage(qrCode);

      // Create pending 2FA record
      await TwoFactorAuth.create({
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
    } else if (method === 'SMS') {
      const user = await User.findByPk(userId);
      if (!user || !user.phone) {
        throw new ValidationError('Phone number not provided', ['Phone number required for SMS 2FA']);
      }

      await TwoFactorAuth.create({
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

    throw new ValidationError('Invalid 2FA method', ['Only TOTP and SMS are supported']);
  }

  /**
   * Verify 2FA setup with OTP
   */
  async verify2FASetup(userId: bigint, otpCode: string): Promise<{ backupCodes: string[] }> {
    const twoFactor = await TwoFactorAuth.findOne({
      where: { userId, isVerified: false },
    });

    if (!twoFactor) {
      throw new NotFoundError('2FA setup not found');
    }

    // Verify TOTP
    if (twoFactor.method === 'TOTP' && twoFactor.secret) {
      const isValid = OTPService.verifyTOTP(otpCode, twoFactor.secret);
      if (!isValid) {
        throw new UnauthorizedError('Invalid OTP');
      }
    }

    // Generate backup codes
    const backupCodes = OTPService.generateBackupCodes(10);
    const backupCodesHash = await OTPService.hashBackupCodes(backupCodes);

    // Enable 2FA
    await twoFactor.update({
      isEnabled: true,
      isVerified: true,
      verifiedAt: new Date(),
      backupCodes: backupCodesHash,
    });

    return { backupCodes };
  }
}

export default new AuthenticationService();
