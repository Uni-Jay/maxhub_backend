"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = exports.BaseController = void 0;
exports.requirePermission = requirePermission;
exports.setupStaffRoutes = setupStaffRoutes;
class BaseController {
    getUser(req) {
        if (!req.userId) {
            throw new Error('User not authenticated');
        }
        return req.userId;
    }
    getPagination(req) {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        return { page, limit };
    }
    getFilters(req, allowedFields) {
        const filters = {};
        allowedFields.forEach((field) => {
            if (req.query[field]) {
                filters[field] = req.query[field];
            }
        });
        return filters;
    }
    sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
        res.status(statusCode).json({
            success: true,
            data,
            message,
            timestamp: new Date().toISOString(),
        });
    }
    sendError(res, message = 'An error occurred', statusCode = 400, errors) {
        res.status(statusCode).json({
            success: false,
            message,
            errors: errors || [],
            timestamp: new Date().toISOString(),
        });
    }
    sendPaginated(res, data, pagination) {
        res.status(200).json({
            success: true,
            data,
            pagination,
            timestamp: new Date().toISOString(),
        });
    }
}
exports.BaseController = BaseController;
class StaffController extends BaseController {
    constructor(staffService) {
        super();
        this.staffService = staffService;
    }
    async getAll(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async getById(req, res, next) {
        try {
            const userId = this.getUser(req);
            const staffId = BigInt(req.params.id);
            const result = await this.staffService.getStaffById(userId, staffId);
            if (!result.success) {
                this.sendError(res, result.message, result.statusCode || 404);
                return;
            }
            this.sendSuccess(res, result.data, 'Staff retrieved successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async create(req, res, next) {
        try {
            const userId = this.getUser(req);
            const staffData = req.body;
            const result = await this.staffService.createStaff(userId, staffData, req.app.get('sequelize'));
            if (!result.success) {
                this.sendError(res, result.message, 400, result.errors);
                return;
            }
            this.sendSuccess(res, result.data, 'Staff created successfully', 201);
        }
        catch (error) {
            next(error);
        }
    }
    async update(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async delete(req, res, next) {
        try {
            const userId = this.getUser(req);
            const staffId = BigInt(req.params.id);
            const result = await this.staffService.deleteStaff(userId, staffId, req.app.get('sequelize'));
            if (!result.success) {
                this.sendError(res, result.message, 403);
                return;
            }
            this.sendSuccess(res, null, 'Staff deleted successfully');
        }
        catch (error) {
            next(error);
        }
    }
    async restore(req, res, next) {
        try {
            const userId = this.getUser(req);
            const staffId = BigInt(req.params.id);
            const result = await this.staffService.restoreStaff(userId, staffId);
            if (!result.success) {
                this.sendError(res, result.message, 403);
                return;
            }
            this.sendSuccess(res, result.data, 'Staff restored successfully');
        }
        catch (error) {
            next(error);
        }
    }
}
exports.StaffController = StaffController;
function requirePermission(...permissions) {
    return (req, res, next) => {
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
function setupStaffRoutes(express, staffController) {
    const router = express.Router();
    router.use((req, res, next) => {
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
    router.get('/', requirePermission('staff.read.all', 'staff.read.own_department'), staffController.getAll.bind(staffController));
    router.get('/:id', requirePermission('staff.read.all', 'staff.read.own', 'staff.read.own_department'), staffController.getById.bind(staffController));
    router.post('/', requirePermission('staff.create.all'), staffController.create.bind(staffController));
    router.put('/:id', requirePermission('staff.update.all', 'staff.update.own'), staffController.update.bind(staffController));
    router.delete('/:id', requirePermission('staff.delete.all'), staffController.delete.bind(staffController));
    router.post('/:id/restore', requirePermission('staff.restore.all'), staffController.restore.bind(staffController));
    return router;
}
//# sourceMappingURL=BaseController.js.map