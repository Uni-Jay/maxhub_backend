import { Router, Request, Response } from 'express';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

/**
 * Routes Aggregator
 * Combines all module routes and applies common middleware
 */
function setupRoutes(app: any): void {
  // Public health check routes
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'OK',
      service: 'MaxHub ERP Backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.get('/api/version', (req: Request, res: Response) => {
    res.json({
      version: process.env.APP_VERSION || '1.0.0',
      name: process.env.APP_NAME || 'MaxHub ERP',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // API Router
  const apiRouter = Router();

  // Apply common middleware to API routes
  apiRouter.use(AuthMiddleware.pagination);
  apiRouter.use(AuthMiddleware.sorting);

  // Authentication routes (public)
  apiRouter.use('/auth', require('./auth.routes').default);

  // Protected routes - require authentication
  apiRouter.use(AuthMiddleware.verifyToken);

  // Dashboard routes
  apiRouter.use('/dashboards', require('./dashboard.routes').default);

  // Organizational routes
  apiRouter.use('/staff', require('./staff.routes').default);
  apiRouter.use('/departments', require('./department.routes').default);
  apiRouter.use('/designations', require('./designation.routes').default);

  // HR Management routes
  apiRouter.use('/hr', require('./hr-management.routes').default);

  // Attendance & Leave routes
  apiRouter.use('/attendance', require('./attendance-management.routes').default);
  apiRouter.use('/leave', require('./leave.routes').default);

  // Project Management routes
  apiRouter.use('/projects', require('./project.routes').default);
  apiRouter.use('/tasks', require('./task.routes').default);
  apiRouter.use('/project-collaboration', require('./project-collaboration.routes').default);

  // CRM routes
  apiRouter.use('/contacts', require('./contact.routes').default);
  apiRouter.use('/opportunities', require('./opportunity.routes').default);

  // Learning Management routes
  apiRouter.use('/courses', require('./course.routes').default);
  apiRouter.use('/enrollments', require('./enrollment.routes').default);

  // Recruitment routes
  apiRouter.use('/job-postings', require('./job-posting.routes').default);
  apiRouter.use('/job-applications', require('./job-application.routes').default);

  // Payroll & Accounting routes
  apiRouter.use('/payroll', require('./payroll.routes').default);
  apiRouter.use('/invoices', require('./invoice.routes').default);

  // Inventory routes
  apiRouter.use('/inventory', require('./inventory.routes').default);
  apiRouter.use('/warehouse', require('./warehouse.routes').default);

  // HR Analytics & Management
  apiRouter.use('/appraisals', require('./appraisal.routes').default);
  apiRouter.use('/training', require('./training.routes').default);

  // Communication routes
  apiRouter.use('/messages', require('./message.routes').default);
  apiRouter.use('/notifications', require('./notification.routes').default);

  // RBAC & Administration routes
  apiRouter.use('/admin/roles', require('./role.routes').default);
  apiRouter.use('/admin/permissions', require('./permission.routes').default);
  // apiRouter.use('/admin/settings', require('./settingsRoutes').default); // PHASE-25: requires Redis + refactored models

  // Staff Query / Ticket system
  apiRouter.use('/queries', require('./query.routes').default);

  // Client Management
  apiRouter.use('/clients', require('./client.routes').default);

  // Communication
  apiRouter.use('/communication', require('./communication.routes').default);

  // Register API router
  app.use('/api', apiRouter);

  // 404 handler
  app.use(ErrorMiddleware.notFound);

  // Global error handler (MUST be last)
  app.use(ErrorMiddleware.handle);
}

export default setupRoutes;
