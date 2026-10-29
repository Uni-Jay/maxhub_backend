import { Router, Request } from 'express';
export declare function track(req: Request | null, entityType: string, entityId: any, event: string, content: string, meta?: any): Promise<void>;
export declare function statusLabel(s: string): string;
export declare function trackTaskChange(req: Request, before: any, after: any): Promise<void>;
export declare function trackingRouter(): Router;
//# sourceMappingURL=tracking.d.ts.map