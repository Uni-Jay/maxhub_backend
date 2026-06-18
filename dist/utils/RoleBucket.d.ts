import { Request } from 'express';
export type RoleBucket = 'superadmin' | 'admin' | 'hr' | 'hod' | 'staff';
export declare function getRoleBucket(req: Request): RoleBucket;
//# sourceMappingURL=RoleBucket.d.ts.map