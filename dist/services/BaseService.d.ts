export declare abstract class BaseService {
    protected checkPermission(userId: bigint, permissionCode: string, userRepo: any): Promise<boolean>;
    protected checkAnyPermission(userId: bigint, permissionCodes: string[], userRepo: any): Promise<boolean>;
    protected checkAllPermissions(userId: bigint, permissionCodes: string[], userRepo: any): Promise<boolean>;
    protected getScopeFilter(userScope: 'own' | 'own_department' | 'all', userId: bigint, departmentId?: bigint): any;
    protected createAuditLog(auditRepo: any, data: {
        userId: bigint;
        module: string;
        action: string;
        tableAffected: string;
        recordId: bigint;
        oldValues?: any;
        newValues?: any;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    protected validateBusinessRules(data: any, rules: any): {
        valid: boolean;
        errors: string[];
    };
    protected executeInTransaction(sequelize: any, callback: (transaction: any) => Promise<any>): Promise<any>;
    protected retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
    protected formatResponse(success: boolean, data?: any, message?: string, errors?: string[]): any;
}
export declare class StaffService extends BaseService {
    private staffRepo;
    private userRepo;
    private auditRepo;
    constructor(staffRepo: any, userRepo: any, auditRepo: any);
    getStaff(userId: bigint, departmentId?: bigint, options?: {
        page?: number;
        limit?: number;
    }): Promise<any>;
    createStaff(userId: bigint, staffData: any, sequelize: any): Promise<any>;
    updateStaff(userId: bigint, staffId: bigint, updates: any, sequelize: any): Promise<any>;
}
//# sourceMappingURL=BaseService.d.ts.map