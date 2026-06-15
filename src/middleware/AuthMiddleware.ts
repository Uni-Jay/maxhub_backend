import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { UnauthorizedError } from '@utils/ErrorHandler';

export class AuthMiddleware {
  static verifyToken(req: Request, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        throw new UnauthorizedError('Missing authorization token');
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError('Invalid authorization header format');
      }

      const token = parts[1];
      const secret = process.env.JWT_SECRET || 'access-secret-key';

      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;

      req.user = {
        id: decoded.id,
        uuid: decoded.uuid,
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        staffId: decoded.staffId,
        departmentId: decoded.departmentId,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        ResponseFormatter.unauthorized(res, error.message, req.path);
      } else {
        ResponseFormatter.unauthorized(res, 'Invalid or expired token', req.path);
      }
    }
  }

  static optionalAuth(req: Request, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return next();

      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') return next();

      const token = parts[1];
      const secret = process.env.JWT_SECRET || 'access-secret-key';
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as any;

      req.user = {
        id: decoded.id,
        uuid: decoded.uuid,
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        staffId: decoded.staffId,
        departmentId: decoded.departmentId,
      };

      next();
    } catch {
      next();
    }
  }

  static isAuthenticated(req: Request): boolean {
    return Boolean(req.user);
  }

  static requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ResponseFormatter.unauthorized(res, 'User not authenticated', req.path);
        return;
      }
      const hasRole = roles.some((role) => req.user?.roles.includes(role));
      if (!hasRole) {
        ResponseFormatter.forbidden(res, `Required roles: ${roles.join(', ')}`, req.path);
        return;
      }
      next();
    };
  }

  static requirePermission(...permissions: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        ResponseFormatter.unauthorized(res, 'User not authenticated', req.path);
        return;
      }
      const hasPermission = permissions.some((p) => req.user?.permissions.includes(p));
      if (!hasPermission) {
        ResponseFormatter.forbidden(res, `Required permissions: ${permissions.join(', ')}`, req.path);
        return;
      }
      next();
    };
  }

  static pagination(req: Request, res: Response, next: NextFunction): void {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    req.pagination = { page, limit, offset };
    next();
  }

  static sorting(req: Request, res: Response, next: NextFunction): void {
    const sortField = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = ((req.query.sortOrder as string) || 'DESC').toUpperCase() as 'ASC' | 'DESC';
    if (!['ASC', 'DESC'].includes(sortOrder)) {
      ResponseFormatter.error(res, 'Invalid sort order. Use ASC or DESC', 400, null, req.path);
      return;
    }
    req.sort = { field: sortField, order: sortOrder };
    next();
  }
}

export default AuthMiddleware;
