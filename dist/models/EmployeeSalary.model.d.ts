import { Model, Optional, Sequelize } from 'sequelize';
interface EmployeeSalaryAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    payrollPeriodId: bigint;
    baseSalary: number;
    grossSalary: number;
    netSalary: number;
    totalEarnings: number;
    totalDeductions: number;
    incomeTax?: number;
    providentFund?: number;
    healthInsurance?: number;
    otherDeductions?: number;
    advanceAmount?: number;
    bonus?: number;
    status: 'Draft' | 'Approved' | 'Processed' | 'Paid' | 'OnHold';
    processedOn?: Date;
    paidOn?: Date;
    bankAccountNumber?: string;
    remarks?: string;
    deletedAt?: Date;
}
interface EmployeeSalaryCreationAttributes extends Optional<EmployeeSalaryAttributes, 'id' | 'uuid'> {
}
export declare class EmployeeSalary extends Model<EmployeeSalaryAttributes, EmployeeSalaryCreationAttributes> implements EmployeeSalaryAttributes {
    id: bigint;
    uuid: string;
    staffId: bigint;
    payrollPeriodId: bigint;
    baseSalary: number;
    grossSalary: number;
    netSalary: number;
    totalEarnings: number;
    totalDeductions: number;
    incomeTax?: number;
    providentFund?: number;
    healthInsurance?: number;
    otherDeductions?: number;
    advanceAmount?: number;
    bonus?: number;
    status: 'Draft' | 'Approved' | 'Processed' | 'Paid' | 'OnHold';
    processedOn?: Date;
    paidOn?: Date;
    bankAccountNumber?: string;
    remarks?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof EmployeeSalary;
    calculateDeductions(): number;
    calculateNetSalary(): number;
}
export {};
//# sourceMappingURL=EmployeeSalary.model.d.ts.map