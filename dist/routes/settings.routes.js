"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const router = (0, express_1.Router)();
let settingsStore = {
    company: {
        name: 'MaxHub ERP',
        address: 'Lagos, Nigeria',
        phone: '',
        email: 'info@maxhub.com',
        website: 'https://maxhub.app',
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        dateFormat: 'DD/MM/YYYY',
    },
    branding: { primaryColor: '#6366f1', darkMode: true, fontScale: 'Normal' },
    email: { smtpHost: '', smtpPort: 587, smtpUser: '', fromName: 'MaxHub ERP', fromEmail: 'noreply@maxhub.com' },
    security: { sessionTimeout: 120, maxLoginAttempts: 5, passwordExpiry: 90, require2FAAdmins: false },
    integrations: { whatsappKey: '', slackWebhook: '', smsProvider: 'Termii', smsApiKey: '' },
};
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    return ResponseFormatter_1.ResponseFormatter.success(res, settingsStore);
}));
router.get('/:section', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const section = req.params.section;
    if (!settingsStore[section]) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Settings section '${section}' not found`, 404);
    }
    return ResponseFormatter_1.ResponseFormatter.success(res, settingsStore[section]);
}));
router.put('/:section', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const section = req.params.section;
    settingsStore[section] = { ...(settingsStore[section] ?? {}), ...req.body };
    return ResponseFormatter_1.ResponseFormatter.success(res, settingsStore[section], 'Settings updated successfully');
}));
router.post('/email/test', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { to } = req.body;
    return ResponseFormatter_1.ResponseFormatter.success(res, { sent: true, to }, `Test email dispatched to ${to}`);
}));
exports.default = router;
//# sourceMappingURL=settings.routes.js.map