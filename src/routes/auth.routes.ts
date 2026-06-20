import { Router } from 'express';
import AuthController from '@controllers/AuthController';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { RBACMiddleware } from '@middleware/RBACMiddleware';
import { ResponseFormatter } from '@utils/ResponseFormatter';

const router = Router();

/**
 * PUBLIC AUTHENTICATION ROUTES
 * No authentication required
 */

/**
 * @route   POST /api/auth/login
 * @desc    User login with email and password
 * @access  Public
 * @body    { email, password, deviceId?, deviceName?, rememberMe? }
 */
router.post(
  '/login',
  ErrorMiddleware.asyncHandler(AuthController.login)
);

/**
 * @route   POST /api/auth/register
 * @desc    User registration
 * @access  Public
 * @body    { firstName, lastName, email, password, phone?, departmentId? }
 */
router.post(
  '/register',
  ErrorMiddleware.asyncHandler(AuthController.register)
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 * @body    { refreshToken }
 */
router.post(
  '/refresh-token',
  ErrorMiddleware.asyncHandler(AuthController.refreshToken)
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Initiate password reset - sends email with reset link
 * @access  Public
 * @body    { email }
 */
router.post(
  '/forgot-password',
  ErrorMiddleware.asyncHandler(AuthController.forgotPassword)
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using reset token
 * @access  Public
 * @body    { token, newPassword }
 */
router.post(
  '/reset-password',
  ErrorMiddleware.asyncHandler(AuthController.resetPassword)
);

/**
 * @route   POST /api/auth/send-otp
 * @desc    Send OTP for verification (email, SMS, etc.)
 * @access  Public
 * @body    { email, type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION' | '2FA' }
 */
router.post(
  '/send-otp',
  ErrorMiddleware.asyncHandler(AuthController.sendOTP)
);

/**
 * @route   POST /api/auth/2fa/verify-login
 * @desc    Verify 2FA code for login
 * @access  Public
 * @body    { sessionId, otpCode }
 */
router.post(
  '/2fa/verify-login',
  ErrorMiddleware.asyncHandler(AuthController.verify2FALogin)
);

/**
 * PROTECTED AUTHENTICATION ROUTES
 * Requires valid JWT token
 */

/**
 * @route   POST /api/auth/logout
 * @desc    User logout - revoke current session
 * @access  Private
 * @body    { sessionId }
 */
router.post(
  '/logout',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.logout)
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.getProfile)
);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 * @body    { firstName?, lastName?, phone?, avatar? }
 */
router.patch(
  '/profile',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.updateProfile)
);

/**
 * @route   POST /api/auth/change-password/request-otp
 * @desc    Verify currentPassword and email a confirmation code required to complete the change
 * @access  Private
 * @body    { currentPassword }
 */
router.post(
  '/change-password/request-otp',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.requestPasswordChangeOtp)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change current password — requires the OTP from request-otp above
 * @access  Private
 * @body    { currentPassword, newPassword, otpCode }
 */
router.post(
  '/change-password',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.changePassword)
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email with OTP code
 * @access  Private
 * @body    { otpCode }
 */
router.post(
  '/verify-email',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.verifyEmail)
);

/**
 * TWO-FACTOR AUTHENTICATION ROUTES
 * Requires valid JWT token
 */

/**
 * @route   POST /api/auth/2fa/setup
 * @desc    Setup 2FA - returns QR code for TOTP or SMS details
 * @access  Private
 * @body    { method: 'TOTP' | 'SMS' | 'EMAIL' }
 */
router.post(
  '/2fa/setup',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.setup2FA)
);

/**
 * @route   POST /api/auth/2fa/verify
 * @desc    Verify 2FA setup with OTP code - generates backup codes
 * @access  Private
 * @body    { otpCode }
 */
router.post(
  '/2fa/verify',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.verify2FA)
);

/**
 * @route   POST /api/auth/2fa/disable
 * @desc    Disable 2FA (requires password confirmation)
 * @access  Private
 * @body    { password }
 */
router.post(
  '/2fa/disable',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.disable2FA)
);

/**
 * @route   POST /api/auth/2fa/enable
 * @desc    Enable email-based 2FA for current user
 * @access  Private
 */
router.post(
  '/2fa/enable',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.enable2FA)
);

/**
 * @route   POST /api/auth/2fa/send-login-otp
 * @desc    Resend login OTP during MFA step (public — caller provides sessionId)
 * @access  Public
 * @body    { sessionId }
 */
router.post(
  '/2fa/send-login-otp',
  ErrorMiddleware.asyncHandler(AuthController.sendLoginOTP)
);

/**
 * @route   POST /api/auth/2fa/verify-login-otp
 * @desc    Verify login OTP and issue tokens (alias for verify-login)
 * @access  Public
 * @body    { sessionId, otpCode }
 */
router.post(
  '/2fa/verify-login-otp',
  ErrorMiddleware.asyncHandler(AuthController.verify2FALogin)
);

/**
 * SESSION MANAGEMENT ROUTES
 * Requires valid JWT token
 */

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Private
 */
router.get(
  '/sessions',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.getSessions)
);

/**
 * @route   POST /api/auth/sessions/:sessionId/revoke
 * @desc    Revoke a specific session
 * @access  Private
 * @params  { sessionId }
 */
router.post(
  '/sessions/:sessionId/revoke',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(AuthController.revokeSession)
);

/**
 * @route   POST /api/auth/admin/unlock-all
 * @desc    Superadmin utility — resets loginAttempts and clears lockedUntil for all users
 * @access  Private (superadmin only)
 */
router.post(
  '/admin/unlock-all',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('superadmin'),
  ErrorMiddleware.asyncHandler(async (_req, res) => {
    const { User } = await import('@models/User.model');
    const { Op } = await import('sequelize');
    const count = await User.update(
      { loginAttempts: 0, lockedUntil: null as any },
      { where: { loginAttempts: { [Op.gt]: 0 } } }
    );
    ResponseFormatter.success(res, { unlocked: count[0] }, `${count[0]} account(s) unlocked`);
  })
);

/**
 * @route   POST /api/auth/admin/reset-demo-passwords
 * @desc    Resets all demo account passwords back to Demo@12345!
 * @access  Private (superadmin only)
 */
router.post(
  '/admin/reset-demo-passwords',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole('superadmin'),
  ErrorMiddleware.asyncHandler(async (_req, res) => {
    const { User } = await import('@models/User.model');
    const bcrypt = await import('bcrypt');
    const DEMO_PASSWORD = 'Demo@12345!';
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const demoEmails = [
      'admin@maxhub.com', 'hr@maxhub.com', 'hod@maxhub.com',
      'staff@maxhub.com', 'accountant@maxhub.com', 'instructor@maxhub.com',
      'receptionist@maxhub.com', 'student@maxhub.com',
    ];
    const { Op } = await import('sequelize');
    const count = await User.update(
      { passwordHash: hash, loginAttempts: 0, lockedUntil: null as any, status: 'Active' },
      { where: { email: { [Op.in]: demoEmails } } }
    );
    ResponseFormatter.success(res, { updated: count[0] }, `${count[0]} demo account(s) reset to Demo@12345!`);
  })
);

export default router;
