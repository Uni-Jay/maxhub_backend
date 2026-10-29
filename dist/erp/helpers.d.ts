import { Request } from 'express';
import { RoleBucket } from '../utils/RoleBucket';
export declare const db: import("sequelize").Sequelize;
export declare function roleOf(req: Request): RoleBucket;
export declare function isSuper(req: Request): boolean;
export declare function isManagement(req: Request): boolean;
export declare function userId(req: Request): number;
export declare function userName(req: Request): string;
export declare function headedDepartmentIds(uid: number): Promise<number[]>;
export declare function memberDepartmentIds(uid: number): Promise<number[]>;
export declare function resolveDepartmentId(v: any): Promise<number | null>;
export declare function departmentFamily(id: number): Promise<number[]>;
export declare function staffUserId(staffId: any): Promise<number | null>;
export declare function nextCode(prefix: string): Promise<string>;
export declare function randomToken(bytes?: number): string;
export declare function sha256(s: string): string;
export declare function emitChange(req: Request | null, entity: string, action: string, data?: any): void;
export declare function audit(req: Request, module: string, action: string, entity: string, entityId: any, description: string, changes?: any): Promise<void>;
export declare function userIdsWithRoles(roles: string[]): Promise<number[]>;
export declare function departmentHeadUserIds(departmentId: number | null | undefined): Promise<number[]>;
export declare function notifyUsers(req: Request | null, userIds: number[], n: {
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    priority?: string;
    entityType?: string;
    entityId?: any;
}, opts?: {
    excludeSelf?: number;
}): Promise<void>;
export declare function toNum(v: any, d?: number): number;
export declare function publicAppUrl(): string;
//# sourceMappingURL=helpers.d.ts.map