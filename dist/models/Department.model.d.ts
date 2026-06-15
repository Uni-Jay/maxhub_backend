import { Model, Optional, Sequelize } from 'sequelize';
interface DepartmentAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    parentDepartmentId?: bigint;
    headUserId?: bigint;
    budget?: number;
    status: 'Active' | 'Inactive' | 'Archived';
    deletedAt?: Date;
}
interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id' | 'uuid'> {
}
export declare class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    parentDepartmentId?: bigint;
    headUserId?: bigint;
    budget?: number;
    status: 'Active' | 'Inactive' | 'Archived';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Department;
}
export {};
//# sourceMappingURL=Department.model.d.ts.map