import { Request } from 'express';
export type RoleBucket = 'superadmin' | 'admin' | 'hr' | 'hod' | 'accountant' | 'staff';
export declare function getRoleBucket(req: Request): RoleBucket;
//# sourceMappingURL=RoleBucket.d.ts.map