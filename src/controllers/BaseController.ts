import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  userId?: bigint;
  userPermissions?: string[];
  ipAddress?: string;
}

/**
 * Base Controller with common request/response handling
 */
export abstract class BaseController {
  /**
   * Extract user from request (assumes middleware sets it)
   */
  protected getUser(req: AuthenticatedRequest): bigint {
    if (!req.userId) {
      throw new Error('User not authenticated');
    }
    return req.userId;
  }

  /**
   * Extract pagination params
   */
  protected getPagination(req: Request): { page: number; limit: number } {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    return { page, limit };
  }

  /**
   * Extract filters
   */
  protected getFilters(req: Request, allowedFields: string[]): any {
    const filters: any = {};
    allowedFields.forEach((field) => {
      if (req.query[field]) {
        filters[field] = req.query[field];
      }
    });
    return filters;
  }

  /**
   * Send success response
   */
  protected sendSuccess(
    res: Response,
    data: any = null,
    message: string = 'Success',
    statusCode: number = 200
  ): void {
    res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send error response
   */
  protected sendError(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 400,
    errors?: string[]
  ): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors: errors || [],
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle pagination response
   */
  protected sendPaginated(
    res: Response,
    data: any[],
    pagination: { count: number; total: number; pages: number; page: number; limit: number }
  ): void {
    res.status(200).json({
      success: true,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Staff Controller Example
 */
export class StaffController extends BaseController {
  private staffService: any;

  constructor(staffService: any) {
    super();
    this.staffService = staffService;
  }

  /**
   * GET /staff - Get all staff with filtering and pagination
   * Permission: staff.read.all | staff.read.own_department
   */
  async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUser(req);
      const { page, limit } = this.getPagination(req);
      const filters = this.getFilters(req, ['departmentId', 'status', 'designationId']);

      const result = await this.staffService.getStaff(userId, filters.departmentId, { page, limit });

      if (!result.success) {
        this.sendError(res, result.message, 403);
        return;
      }

      this.sendPaginated(res, result.data.rows, {
        count: result.data.count,
        total: result.data.total,
        pages: result.data.pages,
        page,
        limit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /staff/:id - Get staff by ID
   * Permission: staff.read.all | staff.read.own | staff.read.own_department
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUser(req);
      const staffId = BigInt(req.params.id);

      const result = await this.staffService.getStaffById(userId, staffId);

      if (!result.success) {
        this.sendError(res, result.message, result.statusCode || 404);
        return;
      }

      this.sendSuccess(res, result.data, 'Staff retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /staff - Create new staff
   * Permission: staff.create.all
   */
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUser(req);
      const staffData = req.body;

      const result = await this.staffService.createStaff(userId, staffData, req.app.get('sequelize'));

      if (!result.success) {
        this.sendError(res, result.message, 400, result.errors);
        return;
      }

      this.sendSuccess(res, result.data, 'Staff created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /staff/:id - Update staff
   * Permission: staff.update.all | staff.update.own
   */
  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUser(req);
      const staffId = BigInt(req.params.id);
      const updates = req.body;

      const result = await this.staffService.updateStaff(userId, staffId, updates, req.app.get('sequelize'));

      if (!result.success) {
        this.sendError(res, result.message, 403);
        return;
      }

      this.sendSuccess(res, result.data, 'Staff updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /staff/:id - Delete staff
   * Permission: staff.delete.all
   */
  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUser(req);
      const staffId = BigInt(req.params.id);

      const result = await this.staffService.deleteStaff(userId, staffId, req.app.get('sequelize'));

      if (!result.success) {
        this.sendError(res, result.message, 403);
        return;
      }

      this.sendSuccess(res, null, 'Staff deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /staff/:id/restore - Restore soft-deleted staff
   * Permission: staff.restore.all
   */
  async restore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = this.getUser(req);
      const staffId = BigInt(req.params.id);

      const result = await this.staffService.restoreStaff(userId, staffId);

      if (!result.success) {
        this.sendError(res, result.message, 403);
        return;
      }

      this.sendSuccess(res, result.data, 'Staff restored successfully');
    } catch (error) {
      next(error);
    }
  }
}

/**
 * RBAC Permission Middleware
 */
export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPermissions = req.userPermissions || [];

    const hasPermission = permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        message: 'Permission denied',
        requiredPermissions: permissions,
        userPermissions,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Example Express Router Setup
 */
export function setupStaffRoutes(express: any, staffController: StaffController) {
  const router = express.Router();

  // All routes require authentication
  router.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    next();
  });

  // Staff routes with RBAC
  router.get(
    '/',
    requirePermission('staff.read.all', 'staff.read.own_department'),
    staffController.getAll.bind(staffController)
  );

  router.get(
    '/:id',
    requirePermission('staff.read.all', 'staff.read.own', 'staff.read.own_department'),
    staffController.getById.bind(staffController)
  );

  router.post(
    '/',
    requirePermission('staff.create.all'),
    staffController.create.bind(staffController)
  );

  router.put(
    '/:id',
    requirePermission('staff.update.all', 'staff.update.own'),
    staffController.update.bind(staffController)
  );

  router.delete(
    '/:id',
    requirePermission('staff.delete.all'),
    staffController.delete.bind(staffController)
  );

  router.post(
    '/:id/restore',
    requirePermission('staff.restore.all'),
    staffController.restore.bind(staffController)
  );

  return router;
}
