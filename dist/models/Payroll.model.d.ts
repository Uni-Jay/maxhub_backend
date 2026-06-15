import { Model } from 'sequelize';
export interface IPayroll {
    id: bigint;
    organizationId: bigint;
    payrollMonth: Date;
    payrollPeriodStart: Date;
    payrollPeriodEnd: Date;
    status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed';
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    totalTaxAmount: number;
    processedBy?: bigint;
    approvedBy?: bigint;
    processedDate?: Date;
    approvedDate?: Date;
    paidDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Payroll extends Model<IPayroll> implements IPayroll {
    id: bigint;
    organizationId: bigint;
    payrollMonth: Date;
    payrollPeriodStart: Date;
    payrollPeriodEnd: Date;
    status: 'Draft' | 'Processed' | 'Approved' | 'Paid' | 'Failed';
    totalEmployees: number;
    totalGrossSalary: number;
    totalDeductions: number;
    totalNetSalary: number;
    totalTaxAmount: number;
    processedBy?: bigint;
    approvedBy?: bigint;
    processedDate?: Date;
    approvedDate?: Date;
    paidDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Payroll;
//# sourceMappingURL=Payroll.model.d.ts.map