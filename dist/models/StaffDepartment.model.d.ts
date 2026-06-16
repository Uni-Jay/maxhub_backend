import { Model, Optional, Sequelize } from 'sequelize';
interface StaffDepartmentAttributes {
    id: bigint;
    staffId: bigint;
    departmentId: bigint;
    isPrimary: boolean;
    assignedAt: Date;
}
interface StaffDepartmentCreationAttributes extends Optional<StaffDepartmentAttributes, 'id' | 'assignedAt'> {
}
export declare class StaffDepartment extends Model<StaffDepartmentAttributes, StaffDepartmentCreationAttributes> implements StaffDepartmentAttributes {
    id: bigint;
    staffId: bigint;
    departmentId: bigint;
    isPrimary: boolean;
    assignedAt: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof StaffDepartment;
}
export {};
//# sourceMappingURL=StaffDepartment.model.d.ts.map