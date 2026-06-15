import { Request } from 'express';

/**
 * Authenticated user context
 */
export interface AuthenticatedUser {
  id: number;
  uuid: string;
  email: string;
  name: string;
  departmentId: number;
  departmentUuid: string;
  roles: string[];
  permissions: string[];
}

/**
 * Extended Express Request with authentication and context
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Unique request ID for tracing
       */
      id?: string;

      /**
       * Authenticated user information
       */
      user?: AuthenticatedUser;

      /**
       * Query execution scope for RBAC filtering
       * 'all' - access to all records (system-wide)
       * 'own' - access to user's own records
       * 'own_department' - access to department-level records
       */
      scope?: 'all' | 'own' | 'own_department';

      /**
       * Pagination parameters
       */
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };

      /**
       * Query filters
       */
      filters?: Record<string, any>;

      /**
       * Sort parameters
       */
      sort?: {
        field: string;
        order: 'ASC' | 'DESC';
      };

      /**
       * Request metadata for audit logging
       */
      metadata?: {
        ipAddress?: string;
        userAgent?: string;
        timestamp: Date;
      };
    }
  }
}
