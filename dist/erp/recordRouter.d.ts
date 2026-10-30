import { Router, Request, Response, NextFunction } from 'express';
import { WhereOptions } from 'sequelize';
export interface RecordConfig {
    model: string;
    entity: string;
    label: string;
    codeSuffix: string;
    searchFields: string[];
    filterFields?: string[];
    stageField?: string;
    stages?: string[];
    defaultBrand?: string;
    actionUrl?: (row: any) => string;
    beforeSave?: (data: any, existing: any | null, req: Request) => Promise<void> | void;
    afterStage?: (row: any, from: string, to: string, req: Request) => Promise<void> | void;
    readOnlyFields?: string[];
}
export declare const wrap: (fn: (req: Request, res: Response) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare function ok(res: Response, data: any, message?: string, status?: number): Response<any, Record<string, any>>;
export declare function fail(res: Response, status: number, message: string): Response<any, Record<string, any>>;
export declare function scopeWhere(req: Request): Promise<WhereOptions | null>;
export declare function canManageRecord(req: Request, row: any): Promise<boolean>;
export declare function clean(body: any, model: any, extraBlocked?: string[]): any;
export declare function logActivity(req: Request, entityType: string, entityId: any, departmentId: any, kind: string, content: string, meta?: any, channel?: string): Promise<any>;
export declare function brandPrefix(departmentId: any): Promise<string>;
export declare function nextClientCode(departmentId: any): Promise<string>;
export declare function buildRecordRouter(cfg: RecordConfig): Router;
//# sourceMappingURL=recordRouter.d.ts.map