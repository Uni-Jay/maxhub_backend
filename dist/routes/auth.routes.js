"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = __importDefault(require("../controllers/AuthController"));
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
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
router.post('/change-password/request-otp', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.requestPasswordChangeOtp));
router.post('/change-password', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.changePassword));
router.post('/verify-email', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.verifyEmail));
router.post('/2fa/setup', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.setup2FA));
router.post('/2fa/verify', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.verify2FA));
router.post('/2fa/disable', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.disable2FA));
router.post('/2fa/enable', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.enable2FA));
router.post('/2fa/send-login-otp', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.sendLoginOTP));
router.post('/2fa/verify-login-otp', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.verify2FALogin));
router.get('/sessions', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.getSessions));
router.post('/sessions/:sessionId/revoke', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(AuthController_1.default.revokeSession));
router.post('/admin/unlock-all', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole('superadmin'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const { User } = await Promise.resolve().then(() => __importStar(require('../models/User.model')));
    const { Op } = await Promise.resolve().then(() => __importStar(require('sequelize')));
    const count = await User.update({ loginAttempts: 0, lockedUntil: null }, { where: { loginAttempts: { [Op.gt]: 0 } } });
    ResponseFormatter_1.ResponseFormatter.success(res, { unlocked: count[0] }, `${count[0]} account(s) unlocked`);
}));
router.post('/admin/reset-demo-passwords', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole('superadmin'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const { User } = await Promise.resolve().then(() => __importStar(require('../models/User.model')));
    const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
    const DEMO_PASSWORD = 'Demo@12345!';
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const demoEmails = [
        'admin@maxhub.com', 'hr@maxhub.com', 'hod@maxhub.com',
        'staff@maxhub.com', 'accountant@maxhub.com', 'instructor@maxhub.com',
        'receptionist@maxhub.com', 'student@maxhub.com',
    ];
    const { Op } = await Promise.resolve().then(() => __importStar(require('sequelize')));
    const count = await User.update({ passwordHash: hash, loginAttempts: 0, lockedUntil: null, status: 'Active' }, { where: { email: { [Op.in]: demoEmails } } });
    ResponseFormatter_1.ResponseFormatter.success(res, { updated: count[0] }, `${count[0]} demo account(s) reset to Demo@12345!`);
}));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map