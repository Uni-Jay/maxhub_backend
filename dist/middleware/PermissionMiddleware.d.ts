import { Request, Response, NextFunction } from 'express';
type ModuleAction = 'view' | 'create' | 'edit' | 'delete';
export declare const checkPermission: (moduleCode: string, action: ModuleAction) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=PermissionMiddleware.d.ts.map