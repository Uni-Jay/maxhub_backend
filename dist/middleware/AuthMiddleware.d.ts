import { Request, Response, NextFunction } from 'express';
export declare class AuthMiddleware {
    static verifyToken(req: Request, res: Response, next: NextFunction): void;
    static optionalAuth(req: Request, res: Response, next: NextFunction): void;
    static isAuthenticated(req: Request): boolean;
    static requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
    static requirePermission(...permissions: string[]): (req: Request, res: Response, next: NextFunction) => void;
    static pagination(req: Request, res: Response, next: NextFunction): void;
    static sorting(req: Request, res: Response, next: NextFunction): void;
}
export default AuthMiddleware;
//# sourceMappingURL=AuthMiddleware.d.ts.map