"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startErpScheduler = exports.runErpMigrations = void 0;
exports.mountErpPublic = mountErpPublic;
exports.mountErpProtected = mountErpProtected;
const express_1 = require("express");
const core_1 = require("./routes/core");
const brandModules_1 = require("./routes/brandModules");
const people_1 = require("./people");
const tracking_1 = require("./tracking");
const inventory_1 = require("./inventory");
const fx_1 = require("./fx");
const public_1 = require("./routes/public");
const approvalGuard_1 = require("./approvalGuard");
const rateLimit_1 = require("./rateLimit");
const recordRouter_1 = require("./recordRouter");
var migrate_1 = require("./migrate");
Object.defineProperty(exports, "runErpMigrations", { enumerable: true, get: function () { return migrate_1.runErpMigrations; } });
var scheduler_1 = require("./scheduler");
Object.defineProperty(exports, "startErpScheduler", { enumerable: true, get: function () { return scheduler_1.startErpScheduler; } });
function mountErpPublic(apiRouter) {
    apiRouter.use(require('./auditTrail').authAuditMiddleware());
    apiRouter.use('/public', (0, public_1.publicRouter)());
    apiRouter.use('/auth/login', (0, rateLimit_1.rateLimit)('login', 15, 15 * 60000));
    apiRouter.use('/auth/forgot-password', (0, rateLimit_1.rateLimit)('forgot', 8, 15 * 60000));
    apiRouter.use('/auth/reset-password', (0, rateLimit_1.rateLimit)('reset', 10, 15 * 60000));
    apiRouter.use('/auth/send-otp', (0, rateLimit_1.rateLimit)('otp', 8, 15 * 60000));
    apiRouter.use('/auth/register', (0, rateLimit_1.rateLimit)('register', 5, 60 * 60000));
}
function mountErpProtected(apiRouter) {
    apiRouter.use(require('./auditTrail').changeAuditMiddleware());
    apiRouter.use((0, approvalGuard_1.approvalGuardRouter)());
    const erp = (0, express_1.Router)();
    erp.use((0, rateLimit_1.rateLimit)('erp-api', 600, 60000));
    erp.get('/calls/ice', (_req, res) => {
        const iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
        if (process.env.TURN_URL) {
            iceServers.push({ urls: process.env.TURN_URL.split(','), username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL });
        }
        res.json({ success: true, data: { iceServers } });
    });
    erp.use((0, core_1.coreRouter)());
    erp.use((0, brandModules_1.brandModulesRouter)());
    erp.use((0, people_1.peopleRouter)());
    erp.use((0, tracking_1.trackingRouter)());
    erp.use((0, inventory_1.inventoryRouter)());
    erp.use((0, fx_1.fxRouter)());
    erp.use((err, _req, res, _next) => {
        console.error('[ERP]', err?.message || err);
        const msg = err?.name === 'SequelizeValidationError' || err?.name === 'SequelizeDatabaseError' ? `Invalid data: ${err?.errors?.[0]?.message || err.message}` : 'Something went wrong. Please try again.';
        return (0, recordRouter_1.fail)(res, err?.name?.startsWith('Sequelize') ? 400 : 500, msg);
    });
    apiRouter.use('/erp', erp);
}
//# sourceMappingURL=index.js.map