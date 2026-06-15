"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
function setupRoutes(app) {
    app.get('/health', (req, res) => {
        res.json({
            status: 'OK',
            service: 'MaxHub ERP Backend',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });
    app.get('/api/version', (req, res) => {
        res.json({
            version: process.env.APP_VERSION || '1.0.0',
            name: process.env.APP_NAME || 'MaxHub ERP',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
        });
    });
    const apiRouter = (0, express_1.Router)();
    apiRouter.use(AuthMiddleware_1.default.pagination);
    apiRouter.use(AuthMiddleware_1.default.sorting);
    apiRouter.use('/auth', require('./auth.routes').default);
    apiRouter.use(AuthMiddleware_1.default.verifyToken);
    apiRouter.use('/staff', require('./staff.routes').default);
    apiRouter.use('/departments', require('./department.routes').default);
    apiRouter.use('/designations', require('./designation.routes').default);
    apiRouter.use('/attendance', require('./attendance.routes').default);
    apiRouter.use('/leave', require('./leave.routes').default);
    apiRouter.use('/projects', require('./project.routes').default);
    apiRouter.use('/tasks', require('./task.routes').default);
    apiRouter.use('/contacts', require('./contact.routes').default);
    apiRouter.use('/opportunities', require('./opportunity.routes').default);
    apiRouter.use('/courses', require('./course.routes').default);
    apiRouter.use('/enrollments', require('./enrollment.routes').default);
    apiRouter.use('/job-postings', require('./job-posting.routes').default);
    apiRouter.use('/job-applications', require('./job-application.routes').default);
    apiRouter.use('/payroll', require('./payroll.routes').default);
    apiRouter.use('/invoices', require('./invoice.routes').default);
    apiRouter.use('/inventory', require('./inventory.routes').default);
    apiRouter.use('/warehouse', require('./warehouse.routes').default);
    apiRouter.use('/appraisals', require('./appraisal.routes').default);
    apiRouter.use('/training', require('./training.routes').default);
    apiRouter.use('/messages', require('./message.routes').default);
    apiRouter.use('/notifications', require('./notification.routes').default);
    apiRouter.use('/admin/roles', require('./role.routes').default);
    apiRouter.use('/admin/permissions', require('./permission.routes').default);
    apiRouter.use('/admin/settings', require('./settings.routes').default);
    app.use('/api', apiRouter);
    app.use(ErrorMiddleware_1.ErrorMiddleware.notFound);
    app.use(ErrorMiddleware_1.ErrorMiddleware.handle);
}
//# sourceMappingURL=index.js.map