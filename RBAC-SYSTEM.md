# RBAC System Implementation Guide

## Overview

The MaxHub ERP system includes a comprehensive Role-Based Access Control (RBAC) system with:
- **230+ Permission Codes** covering all 83 models and operations
- **9 System Roles** with hierarchical authority levels
- **3 Scope Levels** for granular access control (all, own, own_department)
- **Permission-First Architecture** - permissions define what users can do
- **Centralized Permission Management** - all permissions defined in one place

---

## System Architecture

### Permission Code Format

All permissions follow the format: `module.resource.action.scope`

**Example**: `org.staff.update.own_department`
- **Module**: `org` (Organizational)
- **Resource**: `staff` (Staff members)
- **Action**: `update` (Modification action)
- **Scope**: `own_department` (Limited to own department)

### Scope Levels

1. **`all`** - Full access across entire system
   - Example: `crm.contact.read.all` - Can read all contacts

2. **`own_department`** - Limited to own department
   - Example: `att.attendance.read.own_department` - Can view attendance of own department members

3. **`own`** - Limited to own resources
   - Example: `leave.request.read.own` - Can read only own leave requests

---

## 9 System Roles

### Role Hierarchy (High to Low Authority)

1. **SUPER_ADMIN** (Level 9)
   - Full system access
   - All permissions granted
   - System configuration
   - Use case: System administrators, IT staff

2. **ADMIN** (Level 8)
   - Administrative functions
   - User and role management
   - System settings
   - Use case: Administrative staff

3. **DEPARTMENT_HEAD** (Level 7)
   - Department oversight
   - Approve timesheets, leave requests
   - Department staff management
   - Use case: Department managers

4. **MANAGER** (Level 6)
   - Team management
   - Project and task management
   - Expense and quote approvals
   - Use case: Project managers, sales managers

5. **SUPERVISOR** (Level 5)
   - Direct team supervision
   - Attendance marking
   - Task assignment
   - Use case: Team supervisors

6. **TEAM_LEAD** (Level 4)
   - Team coordination
   - Task updates
   - Communication facilitation
   - Use case: Team coordinators

7. **STAFF** (Level 3)
   - Regular employee access
   - Own information management
   - Task execution
   - Use case: Regular employees

8. **CONSULTANT** (Level 2)
   - Limited operational access
   - Project participation
   - Communication only
   - Use case: External consultants

9. **INTERN** (Level 1)
   - Minimal system access
   - Training and learning only
   - Limited communication
   - Use case: Interns, trainees

---

## File Structure

```
src/
├── config/
│   ├── PermissionCodes.ts        # 230+ Permission definitions
│   └── RolesConfig.ts            # Role-permission mappings
├── services/
│   └── RBACService.ts            # Permission checking logic
├── middleware/
│   └── RBACMiddleware.ts          # Route protection middleware
└── controllers/
    └── BaseController.ts         # RBAC integration in responses
```

---

## Usage Examples

### 1. Checking Permissions in Service Layer

```typescript
import { BaseService } from '@services/BaseService';
import { PermissionCode } from '@config/PermissionCodes';

export class StaffService extends BaseService {
  async updateStaff(userId: bigint, staffId: bigint, data: any) {
    // Check if user can update staff (owns the record)
    await this.checkPermission(
      userId,
      PermissionCode.ORG_STAFF_UPDATE_OWN,
      staffId // Resource owner for scope checking
    );

    // Or check if user has any permission (OR logic)
    await this.checkAnyPermission(userId, [
      PermissionCode.ORG_STAFF_UPDATE_ALL,
      PermissionCode.ORG_STAFF_UPDATE_OWN_DEPARTMENT,
    ]);

    // Proceed with update
    const result = await this.staffRepository.update(staffId, data);
    
    // Audit log
    await this.createAuditLog(userId, 'UPDATE', 'Staff', staffId, data);
    
    return result;
  }
}
```

### 2. Protecting Routes with Middleware

```typescript
import { Router, Request, Response } from 'express';
import { RBACMiddleware } from '@middleware/RBACMiddleware';
import { PermissionCode } from '@config/PermissionCodes';
import { Sequelize } from 'sequelize';

const router = Router();
const rbac = new RBACMiddleware(sequelize);

// Single permission check
router.post('/staff',
  rbac.requirePermission(PermissionCode.ORG_STAFF_CREATE_ALL),
  async (req: AuthenticatedRequest, res: Response) => {
    // Handler code
  }
);

// Multiple permissions (OR logic)
router.get('/leave-requests',
  rbac.requireAnyPermission([
    PermissionCode.LEAVE_REQUEST_READ_ALL,
    PermissionCode.LEAVE_REQUEST_READ_OWN_DEPARTMENT,
  ]),
  async (req: AuthenticatedRequest, res: Response) => {
    // Handler code
  }
);

// With scope-based filtering
router.get('/attendance',
  rbac.attachScopeFilter(PermissionCode.ATT_ATTENDANCE_READ_ALL),
  async (req: AuthenticatedRequest, res: Response) => {
    const scope = (req as any).scope; // 'all', 'own', or 'own_department'
    // Use scope for query filtering
  }
);

// Verify resource ownership
router.delete('/task/:id',
  rbac.requirePermission(PermissionCode.TASK_DELETE_ALL),
  rbac.verifyResourceOwner('id', 'createdById'),
  async (req: AuthenticatedRequest, res: Response) => {
    // Handler code
  }
);
```

### 3. Scope-Based Query Filtering

```typescript
export class ContactService extends BaseService {
  async getContacts(userId: bigint, filters: any) {
    // Get user's scope for this operation
    const scope = await this.getScopeFilter(userId, PermissionCode.CRM_CONTACT_READ_ALL);

    let query: any = {};

    // Apply scope-based filters
    if (scope === 'own') {
      query.createdById = userId;
    } else if (scope === 'own_department') {
      const user = await this.getUser(userId);
      query.departmentId = user.departmentId;
    }
    // 'all' scope requires no additional filtering

    return await this.contactRepository.findAll(query, filters);
  }
}
```

### 4. Complex Permission Checking

```typescript
export class LeaveService extends BaseService {
  async approveLeaveRequest(userId: bigint, leaveRequestId: bigint) {
    const leaveRequest = await this.leaveRepository.findById(leaveRequestId);

    // Check if user can approve this specific leave request
    const canApprove = await this.canPerformAction(
      userId,
      PermissionCode.LEAVE_REQUEST_APPROVE_OWN_DEPARTMENT,
      undefined, // No owner check needed for approvals
      leaveRequest.staffId, // Check department match
      userDepartmentId
    );

    if (!canApprove) {
      throw new Error('Cannot approve leave request - insufficient permissions');
    }

    return await this.leaveRepository.update(leaveRequestId, {
      status: 'Approved',
      approvedBy: userId,
      approvedDate: new Date(),
    });
  }
}
```

---

## Permission Codes by Module

### Authentication Module (8 permissions)
- `auth.user.create.all` - Create users
- `auth.user.read.all` - Read all users
- `auth.user.read.own` - Read own user
- `auth.user.update.all` - Update any user
- `auth.user.update.own` - Update own user
- `auth.user.delete.all` - Delete users
- `auth.role.*` - Role management
- `auth.permission.*` - Permission assignment

### Organizational Module (30+ permissions)
- `org.department.*` - Department management
- `org.designation.*` - Job titles
- `org.location.*` - Locations
- `org.staff.*` - Staff management
- `org.qualification.*` - Qualifications
- `org.skill.*` - Skills

### Attendance & Time (15+ permissions)
- `att.shift.*` - Shift management
- `att.attendance.*` - Attendance tracking
- `att.timesheet.*` - Timesheet management

### Leave Management (8+ permissions)
- `leave.type.*` - Leave types
- `leave.request.*` - Leave requests with approval

### Project Management (15+ permissions)
- `project.*` - Projects
- `milestone.*` - Milestones
- `task.*` - Tasks
- `projectnote.*` - Project notes

### CRM & Sales (30+ permissions)
- `crm.contact.*` - Contacts
- `crm.account.*` - Accounts
- `crm.opportunity.*` - Opportunities
- `crm.activity.*` - Activities
- `crm.quote.*` - Quotes
- `crm.order.*` - Orders

### Learning & Development (20+ permissions)
- `lms.course.*` - Courses
- `lms.enrollment.*` - Enrollment
- `lms.exam.*` - Exams
- `lms.certificate.*` - Certificates

### Payroll & Accounting (25+ permissions)
- `pay.structure.*` - Salary structures
- `pay.period.*` - Payroll periods
- `pay.salary.*` - Salary management
- `acc.*` - Accounting operations

### Inventory Management (20+ permissions)
- `inv.category.*` - Product categories
- `inv.item.*` - Inventory items
- `inv.warehouse.*` - Warehouses
- `inv.stock.*` - Stock management
- `inv.supplier.*` - Suppliers
- `inv.po.*` - Purchase orders

### Additional Modules (20+ permissions)
- `rec.*` - Recruitment
- `comm.*` - Communication
- `asset.*` - Asset management
- `hr.*` - HR functions
- `emp.*` - Employee management
- `train.*` - Training
- `survey.*` - Surveys
- `sys.*` - System settings

---

## Implementation Checklist

- [x] Define 230+ permission codes
- [x] Create 9-role hierarchy with permission mappings
- [x] Implement RBACService for permission checking
- [x] Create middleware for route protection
- [x] Integrate with BaseService
- [x] Support scope-based filtering (all/own/own_department)
- [x] Add audit logging for permission decisions
- [x] Document all permissions and roles

### Next Steps (To Implement)
- [ ] Create API endpoints for role management
- [ ] Create API endpoints for user permission assignment
- [ ] Implement permission caching layer
- [ ] Add permission audit reports
- [ ] Create role-based dashboard filtering
- [ ] Implement permission request workflow
- [ ] Add dynamic permission sync with database

---

## Best Practices

### 1. Use Centralized Permission Codes
```typescript
// ✅ GOOD
import { PermissionCode } from '@config/PermissionCodes';
await this.checkPermission(userId, PermissionCode.ORG_STAFF_UPDATE_ALL);

// ❌ BAD
await this.checkPermission(userId, 'org.staff.update.all');
```

### 2. Check Permissions Early
```typescript
// ✅ GOOD - Check at service entry point
async updateStaff(userId, staffId, data) {
  await this.checkPermission(userId, PermissionCode.ORG_STAFF_UPDATE_OWN);
  // Proceed with logic
}

// ❌ BAD - Check scattered throughout function
async updateStaff(userId, staffId, data) {
  const staff = await this.getStaff(staffId);
  // ... 20 lines later
  if (!await this.hasPermission(userId, PermissionCode.ORG_STAFF_UPDATE_OWN)) {
    throw new Error('Access denied');
  }
}
```

### 3. Leverage Scope-Based Filtering
```typescript
// ✅ GOOD - Automatic scope handling
const scope = await this.getScopeFilter(userId, permission);
const contacts = await this.contactRepository.findAll(query, { scope });

// ❌ BAD - Manual scope checking
if (isAdmin) { /* get all */ }
else if (isDepartmentHead) { /* get department */ }
else { /* get own */ }
```

### 4. Use Audit Logging
```typescript
// ✅ GOOD - Track all permission checks
await this.checkPermission(userId, permission);
await this.createAuditLog(userId, 'PERMISSION_CHECK', permission);

// Manual permission tracking in logs
```

---

## Troubleshooting

### User Can't Access Resource
1. Check user has required permission
2. Verify scope matches user's scope level
3. Check role assignments in UserRole table
4. Check for direct permission overrides in UserPermission table
5. Verify permission is not being revoked elsewhere

### Permission Cache Issues
If using caching:
1. Clear permission cache when roles are updated
2. Invalidate user permission cache on permission changes
3. Set reasonable cache TTL (5-10 minutes recommended)

### Performance Optimization
- Cache role-permission mappings in memory
- Use batch permission checks for multiple permissions
- Index UserRole and UserPermission tables
- Consider pre-computing user permissions on login

---

## Security Considerations

1. **Always check permissions on backend** - Never trust frontend permission flags
2. **Use HTTPS** - Protect permission tokens in transit
3. **Audit all permission changes** - Log who modified permissions and when
4. **Rate limit permission checks** - Prevent permission enumeration attacks
5. **Validate user identity** - Ensure authenticated user owns request
6. **Principle of least privilege** - Assign minimum required permissions
7. **Regular permission audits** - Review user permissions quarterly

---

## Related Documentation

- [Architecture Guide](./ARCHITECTURE-GUIDE.md) - Overall system design
- [Model Registry](./MODEL-REGISTRY.md) - All 83 models reference
- [Permission Codes](./PermissionCodes.ts) - Complete permission list
- [Roles Configuration](./RolesConfig.ts) - Role-permission mappings

