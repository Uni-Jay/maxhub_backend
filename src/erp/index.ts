import { Router, Request, Response } from 'express';
import { coreRouter } from './routes/core';
import { brandModulesRouter } from './routes/brandModules';
import { peopleRouter } from './people';
import { trackingRouter } from './tracking';
import { inventoryRouter } from './inventory';
import { fxRouter } from './fx';
import { profitRouter } from './profit';
import { agendaRouter } from './agenda';
import { publicRouter } from './routes/public';
import { approvalGuardRouter } from './approvalGuard';
import { rateLimit } from './rateLimit';
import { fail } from './recordRouter';

export { runErpMigrations } from './migrate';
export { startErpScheduler } from './scheduler';

/** Routes that must be reachable without a login (mounted before verifyToken). */
export function mountErpPublic(apiRouter: Router): void {
  apiRouter.use(require('./auditTrail').authAuditMiddleware());
  apiRouter.use('/public', publicRouter());
  apiRouter.use('/public', require('./bookings').bookingsPublicRouter());
  // Brute-force protection on the sign-in / password endpoints.
  apiRouter.use('/auth/login', rateLimit('login', 15, 15 * 60_000));
  apiRouter.use('/auth/forgot-password', rateLimit('forgot', 8, 15 * 60_000));
  apiRouter.use('/auth/reset-password', rateLimit('reset', 10, 15 * 60_000));
  apiRouter.use('/auth/send-otp', rateLimit('otp', 8, 15 * 60_000));
  apiRouter.use('/auth/register', rateLimit('register', 5, 60 * 60_000));
}

/** Authenticated ERP v2 routes (mounted after verifyToken, before module routers). */
export function mountErpProtected(apiRouter: Router): void {
  apiRouter.use(require('./auditTrail').changeAuditMiddleware());
  apiRouter.use(approvalGuardRouter());
  const erp = Router();
  erp.use(rateLimit('erp-api', 600, 60_000));
  erp.get('/calls/ice', (_req: Request, res: Response) => {
    const iceServers: any[] = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
    if (process.env.TURN_URL) {
      iceServers.push({ urls: process.env.TURN_URL.split(','), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
    }
    res.json({ success: true, data: { iceServers } });
  });
  erp.use(coreRouter());
  erp.use(brandModulesRouter());
  erp.use(peopleRouter());
  erp.use(trackingRouter());
  erp.use(inventoryRouter());
  erp.use(fxRouter());
  erp.use(require('./birthdays').birthdaysRouter());
  erp.use(require('./targets').targetsRouter());
  erp.use(require('./development').developmentRouter());
  erp.use(require('./procurement').procurementRouter());
  erp.use(require('./recruitment').recruitmentRouter());
  erp.use(require('./compliance').complianceRouter());
  erp.use(require('./smart').smartRouter());
  erp.use(require('./lessons').lessonsRouter());
  erp.use(require('./recognition').recognitionRouter());
  erp.use(require('./minutes').minutesRouter());
  erp.use(require('./bookings').bookingsRouter());
  erp.use(profitRouter());
  erp.use(agendaRouter());
  erp.use((err: any, _req: Request, res: Response, _next: any) => {
    console.error('[ERP]', err?.message || err);
    const msg = err?.name === 'SequelizeValidationError' || err?.name === 'SequelizeDatabaseError' ? `Invalid data: ${err?.errors?.[0]?.message || err.message}` : 'Something went wrong. Please try again.';
    return fail(res, err?.name?.startsWith('Sequelize') ? 400 : 500, msg);
  });
  apiRouter.use('/erp', erp);
}
