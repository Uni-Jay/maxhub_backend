import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import AuthenticationService from '@services/AuthenticationService';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorHandler } from '@utils/ErrorHandler';
import { User } from '@models/User.model';
import { Session } from '@models/Session.model';

export class AuthController {
  /**
   * Login endpoint
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, deviceId, deviceName, rememberMe } = req.body;

      const result = await AuthenticationService.login({
        email,
        password,
        deviceId,
        deviceName,
        rememberMe,
      });

      if (result.requiresMFA) {
        ResponseFormatter.success(res, {
          sessionId: result.sessionId,
          user: result.user,
          requiresMFA: true,
        }, 'Login successful. Please verify 2FA');
      } else {
        ResponseFormatter.success(res, {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          sessionId: result.sessionId,
        }, 'Login successful');
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register endpoint
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password, phone, departmentId } = req.body;

      const result = await AuthenticationService.register({
        firstName,
        lastName,
        email,
        password,
        phone,
        departmentId,
      });

      ResponseFormatter.success(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
        emailVerificationRequired: true,
      }, 'Registration successful. Please verify your email');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout endpoint
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, refreshToken } = req.body;
      await AuthenticationService.logout(sessionId, refreshToken);
      ResponseFormatter.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh token endpoint
   * POST /api/auth/refresh-token
   */
  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await AuthenticationService.refreshAccessToken(refreshToken);

      ResponseFormatter.success(res, {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password endpoint
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      await AuthenticationService.forgotPassword(email);

      ResponseFormatter.success(res, null, 'Password reset email sent');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password endpoint (OTP-based)
   * POST /api/auth/reset-password
   * Body: { email, otpCode, newPassword }
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otpCode, newPassword } = req.body;

      if (!email || !otpCode || !newPassword) {
        ResponseFormatter.error(res, 'email, otpCode, and newPassword are required', 400);
        return;
      }

      await AuthenticationService.resetPassword(email, otpCode, newPassword);

      ResponseFormatter.success(res, null, 'Password reset successful. Please login again.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email with OTP
   * POST /api/auth/verify-email
   */
  static async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { otpCode } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      await AuthenticationService.verifyEmail(BigInt(userId), otpCode);

      ResponseFormatter.success(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send OTP for verification
   * POST /api/auth/send-otp
   * Body: { email, type: 'PASSWORD_RESET' | 'EMAIL_VERIFICATION' | '2FA' }
   */
  static async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, type } = req.body;

      if (!email || !type) {
        ResponseFormatter.error(res, 'email and type are required', 400);
        return;
      }

      await AuthenticationService.sendOTP(email, type);

      // Always respond success — don't reveal whether the email exists
      ResponseFormatter.success(res, null, `If an account exists for ${email}, an OTP has been sent.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup 2FA
   * POST /api/auth/2fa/setup
   */
  static async setup2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { method } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      const result = await AuthenticationService.setup2FA(BigInt(userId), method);

      ResponseFormatter.success(res, result, '2FA setup initiated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify 2FA setup
   * POST /api/auth/2fa/verify
   */
  static async verify2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { otpCode } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      const result = await AuthenticationService.verify2FASetup(BigInt(userId), otpCode);

      ResponseFormatter.success(res, result, '2FA verified. Save backup codes in a safe place');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable 2FA
   * POST /api/auth/2fa/disable
   */
  static async disable2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { password } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      await AuthenticationService.disable2FA(BigInt(userId), password);
      ResponseFormatter.success(res, null, '2FA disabled');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enable email-based 2FA
   * POST /api/auth/2fa/enable
   */
  static async enable2FA(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }
      await AuthenticationService.enable2FA(BigInt(userId));
      ResponseFormatter.success(res, null, '2FA enabled via email');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend login OTP during MFA step
   * POST /api/auth/2fa/send-login-otp
   */
  static async sendLoginOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        ResponseFormatter.error(res, 'sessionId is required', 400);
        return;
      }
      await AuthenticationService.sendLoginOTP(sessionId);
      ResponseFormatter.success(res, null, 'Verification code sent');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active sessions
   * GET /api/auth/sessions
   */
  static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      const sessions = await Session.findAll({
        where: {
          userId: BigInt(userId),
          expiresAt: { [Op.gt]: new Date() },
        },
        attributes: ['id', 'uuid', 'ipAddress', 'userAgent', 'createdAt', 'expiresAt'],
        order: [['createdAt', 'DESC']],
      });

      ResponseFormatter.success(res, sessions, 'Sessions retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke session
   * POST /api/auth/sessions/:sessionId/revoke
   */
  static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      const session = await Session.findOne({
        where: { uuid: sessionId, userId: BigInt(userId) },
      });

      if (!session) {
        ResponseFormatter.notFound(res, 'Session not found');
        return;
      }

      await session.destroy();
      ResponseFormatter.success(res, null, 'Session revoked');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify MFA code after login
   * POST /api/auth/2fa/verify-login
   * Body: { sessionId, otpCode }
   */
  static async verify2FALogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, otpCode } = req.body;

      if (!sessionId || !otpCode) {
        ResponseFormatter.error(res, 'sessionId and otpCode are required', 400);
        return;
      }

      const result = await AuthenticationService.verify2FALogin(sessionId, otpCode);

      ResponseFormatter.success(res, {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }, 'Login verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      ResponseFormatter.success(res, req.user, 'Profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PATCH /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, phone, avatar } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      const user = await User.findByPk(BigInt(userId));
      if (!user) {
        ResponseFormatter.notFound(res, 'User not found');
        return;
      }

      await user.update({
        firstName: firstName ?? user.firstName,
        lastName: lastName ?? user.lastName,
        phone: phone ?? user.phone,
        avatar: avatar ?? user.avatar,
      });

      ResponseFormatter.success(res, {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      }, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        ResponseFormatter.unauthorized(res, 'Authentication required');
        return;
      }

      if (!currentPassword || !newPassword) {
        ResponseFormatter.error(res, 'currentPassword and newPassword are required', 400);
        return;
      }

      if (newPassword.length < 8) {
        ResponseFormatter.error(res, 'New password must be at least 8 characters', 400);
        return;
      }

      const user = await User.findByPk(BigInt(userId));
      if (!user) {
        ResponseFormatter.notFound(res, 'User not found');
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        ResponseFormatter.error(res, 'Current password is incorrect', 401);
        return;
      }

      const hash = await bcrypt.hash(newPassword, 12);
      await user.update({ passwordHash: hash });

      ResponseFormatter.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
