import { Model } from 'sequelize';
export interface IPayslip {
    id: bigint;
    organizationId: bigint;
    staffId: bigint;
    payrollId: bigint;
    payslipMonth: Date;
    baseSalary: number;
    allowances: number;
    grossSalary: number;
    providentFund: number;
    incomeTax: number;
    professionaltax: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    paymentStatus: 'Pending' | 'Processed' | 'Paid' | 'Failed';
    paymentDate?: Date;
    paymentMethod?: 'Bank Transfer' | 'Check' | 'Cash' | 'Other';
    bankDetails?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export declare class Payslip extends Model<IPayslip> implements IPayslip {
    id: bigint;
    organizationId: bigint;
    staffId: bigint;
    payrollId: bigint;
    payslipMonth: Date;
    baseSalary: number;
    allowances: number;
    grossSalary: number;
    providentFund: number;
    incomeTax: number;
    professionaltax: number;
    otherDeductions: number;
    totalDeductions: number;
    netSalary: number;
    paymentStatus: 'Pending' | 'Processed' | 'Paid' | 'Failed';
    paymentDate?: Date;
    paymentMethod?: 'Bank Transfer' | 'Check' | 'Cash' | 'Other';
    bankDetails?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export default Payslip;
//# sourceMappingURL=Payslip.model.d.ts.map