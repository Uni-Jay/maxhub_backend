import { Request, Response, NextFunction } from 'express';
export declare function rateLimit(bucket: string, max: number, windowMs: number): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
//# sourceMappingURL=rateLimit.d.ts.map