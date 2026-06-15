import { Model, Optional, Sequelize } from 'sequelize';
interface DesignationAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    departmentId?: bigint;
    level: number;
    baseSalary?: number;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
}
interface DesignationCreationAttributes extends Optional<DesignationAttributes, 'id' | 'uuid'> {
}
export declare class Designation extends Model<DesignationAttributes, DesignationCreationAttributes> implements DesignationAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    departmentId?: bigint;
    level: number;
    baseSalary?: number;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Designation;
}
export {};
//# sourceMappingURL=Designation.model.d.ts.map