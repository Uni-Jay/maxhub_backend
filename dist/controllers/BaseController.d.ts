import { Request, Response, NextFunction } from 'express';
interface AuthenticatedRequest extends Request {
    userId?: bigint;
    userPermissions?: string[];
    ipAddress?: string;
}
export declare abstract class BaseController {
    protected getUser(req: AuthenticatedRequest): bigint;
    protected getPagination(req: Request): {
        page: number;
        limit: number;
    };
    protected getFilters(req: Request, allowedFields: string[]): any;
    protected sendSuccess(res: Response, data?: any, message?: string, statusCode?: number): void;
    protected sendError(res: Response, message?: string, statusCode?: number, errors?: string[]): void;
    protected sendPaginated(res: Response, data: any[], pagination: {
        count: number;
        total: number;
        pages: number;
        page: number;
        limit: number;
    }): void;
}
export declare class StaffController extends BaseController {
    private staffService;
    constructor(staffService: any);
    getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    restore(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare function requirePermission(...permissions: string[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function setupStaffRoutes(express: any, staffController: StaffController): any;
export {};
//# sourceMappingURL=BaseController.d.ts.map