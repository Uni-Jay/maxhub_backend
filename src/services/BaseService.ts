/**
 * Base Service class for business logic
 * Implements permission checking, audit logging, and transaction support
 */
export abstract class BaseService {
  /**
   * Check if user has required permission
   */
  protected async checkPermission(
    userId: bigint,
    permissionCode: string,
    userRepo: any
  ): Promise<boolean> {
    const user = await userRepo.findWithPermissions(userId);
    if (!user) return false;

    // Check direct user permissions
    const hasDirectPermission = user.permissions?.some((p: any) => p.code === permissionCode);
    if (hasDirectPermission) return true;

    // Check role-based permissions
    const hasRolePermission = user.roles?.some((role: any) =>
      role.permissions?.some((p: any) => p.code === permissionCode)
    );

    return hasRolePermission || false;
  }

  /**
   * Check if user has ANY of the required permissions
   */
  protected async checkAnyPermission(
    userId: bigint,
    permissionCodes: string[],
    userRepo: any
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      if (await this.checkPermission(userId, code, userRepo)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if user has ALL of the required permissions
   */
  protected async checkAllPermissions(
    userId: bigint,
    permissionCodes: string[],
    userRepo: any
  ): Promise<boolean> {
    for (const code of permissionCodes) {
      if (!(await this.checkPermission(userId, code, userRepo))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get scope-based filter (for own, own_department, or all)
   */
  protected getScopeFilter(userScope: 'own' | 'own_department' | 'all', userId: bigint, departmentId?: bigint): any {
    switch (userScope) {
      case 'own':
        return { staffId: userId };
      case 'own_department':
        return { departmentId };
      case 'all':
      default:
        return {};
    }
  }

  /**
   * Create audit log entry
   */
  protected async createAuditLog(
    auditRepo: any,
    data: {
      userId: bigint;
      module: string;
      action: string;
      tableAffected: string;
      recordId: bigint;
      oldValues?: any;
      newValues?: any;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await auditRepo.create({
        userId: data.userId,
        module: data.module,
        action: data.action,
        tableAffected: data.tableAffected,
        recordId: data.recordId,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
        newValues: data.newValues ? JSON.stringify(data.newValues) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Validate business rules
   */
  protected validateBusinessRules(data: any, rules: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = (data as any)[field];

      // Check required
      if ((rule as any).required && !value) {
        errors.push(`${field} is required`);
      }

      // Check type
      if ((rule as any).type && typeof value !== (rule as any).type) {
        errors.push(`${field} must be of type ${(rule as any).type}`);
      }

      // Check min/max length
      if ((rule as any).minLength && value?.length < (rule as any).minLength) {
        errors.push(`${field} must be at least ${(rule as any).minLength} characters`);
      }

      if ((rule as any).maxLength && value?.length > (rule as any).maxLength) {
        errors.push(`${field} must not exceed ${(rule as any).maxLength} characters`);
      }

      // Check enum
      if ((rule as any).enum && !((rule as any).enum as any[]).includes(value)) {
        errors.push(`${field} must be one of: ${((rule as any).enum as any[]).join(', ')}`);
      }

      // Check custom validator
      if ((rule as any).validator && !((rule as any).validator as Function)(value)) {
        errors.push((rule as any).message || `${field} validation failed`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Transaction wrapper
   */
  protected async executeInTransaction(
    sequelize: any,
    callback: (transaction: any) => Promise<any>
  ): Promise<any> {
    const transaction = await sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Retry logic with exponential backoff
   */
  protected async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Format response
   */
  protected formatResponse(success: boolean, data?: any, message?: string, errors?: string[]): any {
    return {
      success,
      data,
      message: message || (success ? 'Operation successful' : 'Operation failed'),
      errors: errors || [],
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Staff Service Example
 */
export class StaffService extends BaseService {
  private staffRepo: any;
  private userRepo: any;
  private auditRepo: any;

  constructor(staffRepo: any, userRepo: any, auditRepo: any) {
    super();
    this.staffRepo = staffRepo;
    this.userRepo = userRepo;
    this.auditRepo = auditRepo;
  }

  /**
   * Get staff with RBAC filtering
   */
  async getStaff(
    userId: bigint,
    departmentId?: bigint,
    options?: { page?: number; limit?: number }
  ): Promise<any> {
    try {
      // Check permission
      const hasPermission = await this.checkAnyPermission(userId, ['staff.read.all', 'staff.read.own_department'], this.userRepo);
      if (!hasPermission) {
        throw new Error('Permission denied: Cannot read staff');
      }

      // Get scope filter
      const scopeFilter = this.getScopeFilter('own_department', userId, departmentId);

      // Fetch data
      const result = await this.staffRepo.findPaginated(
        options?.page || 1,
        options?.limit || 10,
        scopeFilter
      );

      return this.formatResponse(true, result, 'Staff retrieved successfully');
    } catch (error) {
      return this.formatResponse(false, null, (error as any).message);
    }
  }

  /**
   * Create staff with audit logging
   */
  async createStaff(userId: bigint, staffData: any, sequelize: any): Promise<any> {
    try {
      // Check permission
      const hasPermission = await this.checkPermission(userId, 'staff.create.all', this.userRepo);
      if (!hasPermission) {
        throw new Error('Permission denied: Cannot create staff');
      }

      // Validate data
      const validation = this.validateBusinessRules(staffData, {
        employeeId: { required: true, type: 'string' },
        firstName: { required: true, type: 'string' },
        lastName: { required: true, type: 'string' },
        email: { required: true, type: 'string' },
        departmentId: { required: true, type: 'number' },
      });

      if (!validation.valid) {
        return this.formatResponse(false, null, 'Validation failed', validation.errors);
      }

      // Execute in transaction
      const result = await this.executeInTransaction(sequelize, async (transaction: any) => {
        return await this.staffRepo.create(staffData);
      });

      // Audit log
      await this.createAuditLog(this.auditRepo, {
        userId,
        module: 'staff',
        action: 'create',
        tableAffected: 'staff',
        recordId: result.id,
        newValues: staffData,
      });

      return this.formatResponse(true, result, 'Staff created successfully');
    } catch (error) {
      return this.formatResponse(false, null, (error as any).message);
    }
  }

  /**
   * Update staff with audit logging
   */
  async updateStaff(userId: bigint, staffId: bigint, updates: any, sequelize: any): Promise<any> {
    try {
      // Check permission
      const hasPermission = await this.checkPermission(userId, 'staff.update.all', this.userRepo);
      if (!hasPermission) {
        throw new Error('Permission denied: Cannot update staff');
      }

      // Get old values for audit
      const oldStaff = await this.staffRepo.findById(staffId);
      if (!oldStaff) {
        return this.formatResponse(false, null, 'Staff not found');
      }

      // Execute in transaction
      const updated = await this.executeInTransaction(sequelize, async (transaction: any) => {
        await this.staffRepo.updateById(staffId, updates);
        return await this.staffRepo.findById(staffId);
      });

      // Audit log
      await this.createAuditLog(this.auditRepo, {
        userId,
        module: 'staff',
        action: 'update',
        tableAffected: 'staff',
        recordId: staffId,
        oldValues: oldStaff.toJSON(),
        newValues: updated.toJSON(),
      });

      return this.formatResponse(true, updated, 'Staff updated successfully');
    } catch (error) {
      return this.formatResponse(false, null, (error as any).message);
    }
  }
}
