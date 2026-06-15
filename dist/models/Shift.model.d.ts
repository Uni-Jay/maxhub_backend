import { Model, Optional, Sequelize } from 'sequelize';
interface ShiftAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    breakDuration?: number;
    workingHours: number;
    departmentId?: bigint;
    applicableForDays: string;
    isOvernight: boolean;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
}
interface ShiftCreationAttributes extends Optional<ShiftAttributes, 'id' | 'uuid'> {
}
export declare class Shift extends Model<ShiftAttributes, ShiftCreationAttributes> implements ShiftAttributes {
    id: bigint;
    uuid: string;
    code: string;
    name: string;
    description?: string;
    startTime: string;
    endTime: string;
    breakDuration?: number;
    workingHours: number;
    departmentId?: bigint;
    applicableForDays: string;
    isOvernight: boolean;
    status: 'Active' | 'Inactive';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof Shift;
}
export {};
//# sourceMappingURL=Shift.model.d.ts.map