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
        name: decoded.name || '',
        departmentId: decoded.departmentId || null,
        departmentUuid: decoded.departmentUuid || '',
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
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
        name: decoded.name || '',
        departmentId: decoded.departmentId || null,
        departmentUuid: decoded.departmentUuid || '',
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
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
      // Normalise both sides: strip non-alpha chars and lowercase for comparison
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
      const userNormRoles = (req.user.roles || []).map(norm);
      const hasRole = roles.some((role) => userNormRoles.includes(norm(role)));
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

      // superadmin bypasses all permission checks (normalise legacy codes like SUPER_ADMIN / super_admin)
      const normRoles = (req.user.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
      if (normRoles.includes('superadmin') || normRoles.includes('admin') || normRoles.includes('headofadmin')) {
        return next();
      }

      // Normalise a permission string to lowercase dotted format and generate variants.
      // Handles: UPPERCASE, underscores as separators, and known prefix aliases.
      const PREFIX_ALIASES: Record<string, string> = {
        'finance.': 'fin.',
        'account.': 'acc.',
        'human-resources.': 'hr.',
        'notify.': 'comm.',
      };

      const normalise = (p: string): string[] => {
        const lower = p.toLowerCase();
        // Modern PermissionCode values are already lowercase.dotted (e.g.
        // 'broadcast.create.own_department') — the underscore there is part of
        // the scope literal (own_department/own_warehouse), not a separator, so
        // it must be left alone. Only legacy DOMAIN_RESOURCE_ACTION_SCOPE codes
        // (all-underscore, no dots at all, e.g. 'PAYROLL_VIEW') get converted.
        const converted = lower.includes('.') ? lower : lower.replace(/_/g, '.');
        const variants: string[] = [converted];
        for (const [alias, real] of Object.entries(PREFIX_ALIASES)) {
          if (converted.startsWith(alias)) {
            variants.push(converted.replace(alias, real));
          }
        }
        return variants;
      };

      const userPerms = new Set((req.user.permissions || []).map((p: string) => p.toLowerCase()));

      const hasPermission = permissions.some((reqPerm) =>
        normalise(reqPerm).some((variant) => userPerms.has(variant)),
      );

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
