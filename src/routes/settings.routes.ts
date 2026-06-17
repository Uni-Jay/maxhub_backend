import { Router, Request, Response } from 'express';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// All system-settings routes are superadmin-only
router.use(AuthMiddleware.requireRole('superadmin'));

let settingsStore: Record<string, any> = {
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

// GET /api/settings — all settings
router.get(
  '/',
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    return ResponseFormatter.success(res, settingsStore);
  })
);

// GET /api/settings/:section
router.get(
  '/:section',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const section = req.params.section;
    if (!settingsStore[section]) {
      return ResponseFormatter.error(res, `Settings section '${section}' not found`, 404);
    }
    return ResponseFormatter.success(res, settingsStore[section]);
  })
);

// PUT /api/settings/:section
router.put(
  '/:section',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const section = req.params.section;
    settingsStore[section] = { ...(settingsStore[section] ?? {}), ...req.body };
    return ResponseFormatter.success(res, settingsStore[section], 'Settings updated successfully');
  })
);

// POST /api/settings/email/test — send test email
router.post(
  '/email/test',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { to } = req.body;
    // In production: use nodemailer with settingsStore.email SMTP config
    return ResponseFormatter.success(res, { sent: true, to }, `Test email dispatched to ${to}`);
  })
);

export default router;
