import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@utils/ErrorHandler';
export declare class ErrorMiddleware {
    static handle(err: Error | ApiError, req: Request, res: Response, next: NextFunction): void;
    static asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
    static notFound(req: Request, res: Response, next: NextFunction): void;
}
export default ErrorMiddleware;
//# sourceMappingURL=ErrorMiddleware.d.ts.map