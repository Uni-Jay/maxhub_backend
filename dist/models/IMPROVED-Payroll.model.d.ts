import { Model } from 'sequelize';
export interface IPayroll {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    payrollMonth: Date;
    payrollPeriodStart: Date;
    payrollPeriodEnd: Date;
    status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed' | 'Closed';
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    totalTaxAmount: number;
    processedBy?: bigint;
    processedDate?: Date;
    approvedBy?: bigint;
    approvalDate?: Date;
    paidDate?: Date;
    lockedAt?: Date;
    notes?: string;
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Payroll extends Model<IPayroll> implements IPayroll {
    id: bigint;
    organizationId: bigint;
    departmentId?: bigint;
    payrollMonth: Date;
    payrollPeriodStart: Date;
    payrollPeriodEnd: Date;
    status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed' | 'Closed';
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    totalTaxAmount: number;
    processedBy?: bigint;
    processedDate?: Date;
    approvedBy?: bigint;
    approvalDate?: Date;
    paidDate?: Date;
    lockedAt?: Date;
    notes?: string;
    createdBy?: bigint;
    updatedBy?: bigint;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Payroll;
//# sourceMappingURL=IMPROVED-Payroll.model.d.ts.map