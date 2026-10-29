import { Request, Response, NextFunction, Router } from 'express';
export declare function clientIp(req: Request): string;
export declare function authAuditMiddleware(): import("express-serve-static-core").Router;
export declare function changeAuditMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
export declare function auditLogout(req: Request): Promise<void>;
export declare function auditLogRouter(): Router;
//# sourceMappingURL=auditTrail.d.ts.map