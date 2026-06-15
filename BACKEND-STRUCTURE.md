# Express Backend Structure - Complete

## Overview

This document outlines the complete Express.js backend structure for MaxHub ERP, organized for scalability, maintainability, and RBAC-first security.

## Directory Structure

```
src/
├── index.ts                 # Application entry point
├── app.ts                   # Express app bootstrapper with middleware & model initialization
├── 
├── config/
│   ├── Database.ts         # Sequelize instance & database configuration
│   ├── PermissionCodes.ts  # Centralized permission definitions (230+ codes)
│   └── RolesConfig.ts      # Role hierarchy and permission mappings
│
├── models/
│   ├── *.model.ts          # 83 Sequelize models (all domains)
│   └── Associations.ts     # 150+ model relationships
│
├── services/
│   ├── BaseService.ts      # Base service with common methods
│   └── RBACService.ts      # Permission checking & RBAC validation
│
├── repositories/
│   └── BaseRepository.ts   # Base repository for CRUD operations
│
├── controllers/
│   └── BaseController.ts   # Base controller with response handling
│
├── middleware/
│   ├── AuthMiddleware.ts   # JWT verification & auth context
│   ├── ErrorMiddleware.ts  # Global error handling
│   └── RBACMiddleware.ts   # Permission checking middleware factories
│
├── routes/
│   ├── index.ts            # Routes aggregator
│   ├── auth.routes.ts      # Authentication endpoints (public)
│   ├── staff.routes.ts     # Staff management endpoints
│   ├── attendance.routes.ts # Attendance tracking endpoints
│   ├── project.routes.ts   # Project management endpoints
│   ├── task.routes.ts      # Task management endpoints
│   ├── leave.routes.ts     # Leave management endpoints
│   ├── department.routes.ts
│   ├── designation.routes.ts
│   ├── contact.routes.ts
│   ├── opportunity.routes.ts
│   ├── course.routes.ts
│   ├── enrollment.routes.ts
│   ├── job-posting.routes.ts
│   ├── job-application.routes.ts
│   ├── payroll.routes.ts
│   ├── invoice.routes.ts
│   ├── inventory.routes.ts
│   ├── warehouse.routes.ts
│   ├── appraisal.routes.ts
│   ├── training.routes.ts
│   ├── message.routes.ts
│   ├── notification.routes.ts
│   ├── role.routes.ts
│   ├── permission.routes.ts
│   └── settings.routes.ts
│
├── types/
│   └── express.d.ts        # TypeScript type definitions for Express extensions
│
└── utils/
    ├── ResponseFormatter.ts # Standardized API response formatting
    └── ErrorHandler.ts     # Custom error classes & error utilities
```

## Key Files & Responsibilities

### Entry Point
- **index.ts** - Imports AppBootstrapper and starts the server
- **app.ts** - Main application class that:
  - Initializes Express middleware (security, CORS, parsing)
  - Loads all 83 Sequelize models
  - Initializes model associations
  - Sets up routes
  - Configures error handling

### Configuration
- **Database.ts** - Sequelize connection with connection pooling
- **PermissionCodes.ts** - Enum with 230+ permission codes organized by module
- **RolesConfig.ts** - 9-role hierarchy (SUPER_ADMIN to INTERN) with explicit permission mappings

### Request/Response
- **ResponseFormatter.ts** - Standardized response formatting:
  - Success responses
  - Paginated responses
  - Error responses (validation, auth, permission denied, etc.)
  - HTTP status code mapping

- **ErrorHandler.ts** - Custom error classes:
  - ApiError (base)
  - ValidationError
  - NotFoundError
  - UnauthorizedError
  - ForbiddenError
  - ConflictError
  - DuplicateEntryError
  - DatabaseError
  - BusinessLogicError

### Middleware

1. **AuthMiddleware.ts** - Authentication & authorization:
   - JWT token verification
   - Optional authentication
   - Pagination & sorting parameter extraction
   - Role/permission requirement factories

2. **ErrorMiddleware.ts** - Error handling:
   - 404 handler
   - Global error handler with Sequelize error parsing
   - Response formatting for all error types

3. **RBACMiddleware.ts** - Permission checking middleware factories:
   - `requirePermission(code)` - Single permission check
   - `requireAnyPermission(codes)` - OR logic for multiple permissions
   - `requireAllPermissions(codes)` - AND logic for multiple permissions
   - `attachScopeFilter(code)` - Attach scope (all/own/own_department) to request
   - `verifyResourceOwner(param, field)` - Verify user owns resource
   - `verifyDepartmentAccess(param)` - Prevent cross-department access

### Routes

**Public Routes:**
- `GET /health` - Health check
- `GET /api/version` - Version info
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/auth/forgot-password` - Password reset initiation

**Protected Routes (with RBAC):**
- `/api/staff/*` - Staff management (30+ endpoints planned)
- `/api/projects/*` - Project management
- `/api/tasks/*` - Task management
- `/api/attendance/*` - Attendance tracking
- `/api/leave/*` - Leave management
- And 19+ more module routes

## Type System

### Express Request Extensions
```typescript
interface Request {
  id?: string                    // Unique request ID
  user?: AuthenticatedUser       // Authenticated user context
  scope?: 'all' | 'own' | 'own_department'  // RBAC scope
  pagination?: { page, limit, offset }
  filters?: Record<string, any>
  sort?: { field, order: 'ASC' | 'DESC' }
  metadata?: { ipAddress, userAgent, timestamp }
}
```

### AuthenticatedUser
```typescript
interface AuthenticatedUser {
  id: number
  uuid: string
  email: string
  name: string
  departmentId: number
  departmentUuid: string
  roles: string[]
  permissions: string[]
}
```

## RBAC Integration

### Permission-First Pattern
1. All endpoints require explicit permission checks
2. Permissions are centralized in PermissionCodes enum
3. Roles map to sets of permissions in RolesConfig
4. Middleware validates permissions before route handlers execute

### Scope-Based Access Control
- **all** - System-wide access (admins)
- **own** - User's own records only
- **own_department** - Department-level records

### Usage Example
```typescript
router.get('/',
  RBACMiddleware.requirePermission(PermissionCode.ORG_STAFF_READ),
  RBACMiddleware.attachScopeFilter(PermissionCode.ORG_STAFF_READ),
  asyncHandler(async (req, res) => {
    // req.scope contains 'all' / 'own' / 'own_department'
    // req.user contains authenticated user
  })
);
```

## Environment Configuration

See `.env.example` for all configuration options:
- Database connection (host, port, credentials, pool size)
- JWT secrets & expiry
- CORS origins
- Email (SMTP) configuration
- File uploads
- Cache (Redis)
- Rate limiting
- OTP configuration
- Audit logging

## Error Handling

All errors are caught by the global error handler:
1. Middleware catches errors in try-catch blocks
2. Throws ApiError subclass with appropriate status code
3. Global error handler formats response according to error type
4. Sequelize validation/constraint errors are parsed and formatted
5. Development mode shows full error stack; production mode hides details

## Compilation & Verification

✅ **TypeScript Compilation:** `npx tsc --noEmit` - Zero errors

## Next Steps

1. **Implement Route Handlers** - Replace TODO comments with actual business logic
2. **Implement Service Layer** - Create domain-specific services extending BaseService
3. **Implement Repositories** - Create domain-specific repositories for data access
4. **Implement Controllers** - Create domain-specific controllers for request handling
5. **Database Migrations** - Create schema migration scripts
6. **Seed Data** - Create seed scripts for initial data (roles, permissions, holidays, etc.)
7. **Testing** - Add unit and integration tests for all layers
8. **Documentation** - Generate API documentation (Swagger/OpenAPI)
9. **Performance Optimization** - Add caching, query optimization
10. **Monitoring & Logging** - Integrate logging, monitoring, APM tools

## Standards & Conventions

- **Naming:** camelCase for variables/functions, PascalCase for classes
- **Async:** All async operations use async/await with ErrorMiddleware.asyncHandler
- **Responses:** Always use ResponseFormatter for consistency
- **Errors:** Always throw ApiError or subclass with appropriate status code
- **Comments:** JSDoc for public methods, inline comments for complex logic
- **Modules:** Each domain has dedicated routes, services, repositories, controllers

## Security Features

- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ JWT authentication
- ✅ RBAC with 230+ granular permissions
- ✅ Scope-based access control
- ✅ Soft deletes (paranoid mode)
- ✅ Input validation (via Sequelize models)
- ✅ Sequelize protection against SQL injection
- ✅ Request ID tracking for audit logging
- ⏳ Rate limiting (configured, not yet enforced)
- ⏳ HTTPS enforcement (production)
