import { Request, Response, NextFunction } from 'express';
import AuthenticationService from '@services/AuthenticationService';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorHandler } from '@utils/ErrorHandler';

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
      const { sessionId } = req.body;

      await AuthenticationService.logout(sessionId);

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
   * Reset password endpoint
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      await AuthenticationService.resetPassword(token, newPassword);

      ResponseFormatter.success(res, null, 'Password reset successful. Please login again');
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
   */
  static async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, type } = req.body;

      // TODO: Implement OTP sending logic
      // await OTPService.sendOTP(email, type);

      ResponseFormatter.success(res, null, `OTP sent to ${email}`);
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

      // TODO: Implement 2FA disable logic with password verification

      ResponseFormatter.success(res, null, '2FA disabled');
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

      // TODO: Implement get sessions logic

      ResponseFormatter.success(res, [], 'Sessions retrieved');
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

      // TODO: Implement revoke session logic

      ResponseFormatter.success(res, null, 'Session revoked');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify with 2FA
   * POST /api/auth/2fa/verify-login
   */
  static async verify2FALogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, otpCode } = req.body;

      // TODO: Implement 2FA login verification

      ResponseFormatter.success(res, {
        accessToken: 'token',
        refreshToken: 'token',
      }, 'Login verified with 2FA');
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

      // TODO: Implement update profile logic

      ResponseFormatter.success(res, {}, 'Profile updated');
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

      // TODO: Implement change password logic

      ResponseFormatter.success(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
