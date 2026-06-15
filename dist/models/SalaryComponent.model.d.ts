import { Model, Optional, Sequelize } from 'sequelize';
interface SalaryComponentAttributes {
    id: bigint;
    uuid: string;
    componentCode: string;
    componentName: string;
    componentType: 'Earning' | 'Deduction' | 'Tax' | 'Loan';
    isActive: boolean;
    description?: string;
    deletedAt?: Date;
}
interface SalaryComponentCreationAttributes extends Optional<SalaryComponentAttributes, 'id' | 'uuid'> {
}
export declare class SalaryComponent extends Model<SalaryComponentAttributes, SalaryComponentCreationAttributes> implements SalaryComponentAttributes {
    id: bigint;
    uuid: string;
    componentCode: string;
    componentName: string;
    componentType: 'Earning' | 'Deduction' | 'Tax' | 'Loan';
    isActive: boolean;
    description?: string;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof SalaryComponent;
}
export {};
//# sourceMappingURL=SalaryComponent.model.d.ts.map