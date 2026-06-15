"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffService = exports.BaseService = void 0;
class BaseService {
    async checkPermission(userId, permissionCode, userRepo) {
        const user = await userRepo.findWithPermissions(userId);
        if (!user)
            return false;
        const hasDirectPermission = user.permissions?.some((p) => p.code === permissionCode);
        if (hasDirectPermission)
            return true;
        const hasRolePermission = user.roles?.some((role) => role.permissions?.some((p) => p.code === permissionCode));
        return hasRolePermission || false;
    }
    async checkAnyPermission(userId, permissionCodes, userRepo) {
        for (const code of permissionCodes) {
            if (await this.checkPermission(userId, code, userRepo)) {
                return true;
            }
        }
        return false;
    }
    async checkAllPermissions(userId, permissionCodes, userRepo) {
        for (const code of permissionCodes) {
            if (!(await this.checkPermission(userId, code, userRepo))) {
                return false;
            }
        }
        return true;
    }
    getScopeFilter(userScope, userId, departmentId) {
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
    async createAuditLog(auditRepo, data) {
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
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
    validateBusinessRules(data, rules) {
        const errors = [];
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            if (rule.required && !value) {
                errors.push(`${field} is required`);
            }
            if (rule.type && typeof value !== rule.type) {
                errors.push(`${field} must be of type ${rule.type}`);
            }
            if (rule.minLength && value?.length < rule.minLength) {
                errors.push(`${field} must be at least ${rule.minLength} characters`);
            }
            if (rule.maxLength && value?.length > rule.maxLength) {
                errors.push(`${field} must not exceed ${rule.maxLength} characters`);
            }
            if (rule.enum && !rule.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rule.enum.join(', ')}`);
            }
            if (rule.validator && !rule.validator(value)) {
                errors.push(rule.message || `${field} validation failed`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    async executeInTransaction(sequelize, callback) {
        const transaction = await sequelize.transaction();
        try {
            const result = await callback(transaction);
            await transaction.commit();
            return result;
        }
        catch (error) {
            await transaction.rollback();
            throw error;
        }
    }
    async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                if (attempt === maxRetries - 1)
                    throw error;
                const delay = baseDelay * Math.pow(2, attempt);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error('Max retries exceeded');
    }
    formatResponse(success, data, message, errors) {
        return {
            success,
            data,
            message: message || (success ? 'Operation successful' : 'Operation failed'),
            errors: errors || [],
            timestamp: new Date().toISOString(),
        };
    }
}
exports.BaseService = BaseService;
class StaffService extends BaseService {
    constructor(staffRepo, userRepo, auditRepo) {
        super();
        this.staffRepo = staffRepo;
        this.userRepo = userRepo;
        this.auditRepo = auditRepo;
    }
    async getStaff(userId, departmentId, options) {
        try {
            const hasPermission = await this.checkAnyPermission(userId, ['staff.read.all', 'staff.read.own_department'], this.userRepo);
            if (!hasPermission) {
                throw new Error('Permission denied: Cannot read staff');
            }
            const scopeFilter = this.getScopeFilter('own_department', userId, departmentId);
            const result = await this.staffRepo.findPaginated(options?.page || 1, options?.limit || 10, scopeFilter);
            return this.formatResponse(true, result, 'Staff retrieved successfully');
        }
        catch (error) {
            return this.formatResponse(false, null, error.message);
        }
    }
    async createStaff(userId, staffData, sequelize) {
        try {
            const hasPermission = await this.checkPermission(userId, 'staff.create.all', this.userRepo);
            if (!hasPermission) {
                throw new Error('Permission denied: Cannot create staff');
            }
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
            const result = await this.executeInTransaction(sequelize, async (transaction) => {
                return await this.staffRepo.create(staffData);
            });
            await this.createAuditLog(this.auditRepo, {
                userId,
                module: 'staff',
                action: 'create',
                tableAffected: 'staff',
                recordId: result.id,
                newValues: staffData,
            });
            return this.formatResponse(true, result, 'Staff created successfully');
        }
        catch (error) {
            return this.formatResponse(false, null, error.message);
        }
    }
    async updateStaff(userId, staffId, updates, sequelize) {
        try {
            const hasPermission = await this.checkPermission(userId, 'staff.update.all', this.userRepo);
            if (!hasPermission) {
                throw new Error('Permission denied: Cannot update staff');
            }
            const oldStaff = await this.staffRepo.findById(staffId);
            if (!oldStaff) {
                return this.formatResponse(false, null, 'Staff not found');
            }
            const updated = await this.executeInTransaction(sequelize, async (transaction) => {
                await this.staffRepo.updateById(staffId, updates);
                return await this.staffRepo.findById(staffId);
            });
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
        }
        catch (error) {
            return this.formatResponse(false, null, error.message);
        }
    }
}
exports.StaffService = StaffService;
//# sourceMappingURL=BaseService.js.map