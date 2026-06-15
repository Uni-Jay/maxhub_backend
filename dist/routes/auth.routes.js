"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("@controllers/AuthController"));
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("@middleware/AuthMiddleware");
const router = (0, express_1.Router)();
router.post('/login', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.login));
router.post('/register', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.register));
router.post('/refresh-token', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.refreshToken));
router.post('/forgot-password', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.forgotPassword));
router.post('/reset-password', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.resetPassword));
router.post('/send-otp', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.sendOTP));
router.post('/2fa/verify-login', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.verify2FALogin));
router.post('/logout', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.logout));
router.get('/profile', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.getProfile));
router.patch('/profile', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.updateProfile));
router.post('/change-password', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.changePassword));
router.post('/verify-email', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.verifyEmail));
router.post('/2fa/setup', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.setup2FA));
router.post('/2fa/verify', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.verify2FA));
router.post('/2fa/disable', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.disable2FA));
router.get('/sessions', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.getSessions));
router.post('/sessions/:sessionId/revoke', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.revokeSession));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map