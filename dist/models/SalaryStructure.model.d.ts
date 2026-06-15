import { Model, Optional, Sequelize } from 'sequelize';
interface SalaryStructureAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    departmentId?: bigint;
    designationId?: bigint;
    baseSalary: number;
    status: 'Active' | 'Inactive';
    applicableFromDate: Date;
    applicableToDate?: Date;
    deletedAt?: Date;
}
interface SalaryStructureCreationAttributes extends Optional<SalaryStructureAttributes, 'id' | 'uuid'> {
}
export declare class SalaryStructure extends Model<SalaryStructureAttributes, SalaryStructureCreationAttributes> implements SalaryStructureAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    departmentId?: bigint;
    designationId?: bigint;
    baseSalary: number;
    status: 'Active' | 'Inactive';
    applicableFromDate: Date;
    applicableToDate?: Date;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof SalaryStructure;
    isActive(): boolean;
}
export {};
//# sourceMappingURL=SalaryStructure.model.d.ts.map