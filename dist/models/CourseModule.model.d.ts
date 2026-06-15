import { Model, Optional, Sequelize } from 'sequelize';
interface CourseModuleAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    moduleCode: string;
    moduleName: string;
    description?: string;
    sequence: number;
    duration: number;
    status: 'Draft' | 'Published' | 'Archived';
    deletedAt?: Date;
}
interface CourseModuleCreationAttributes extends Optional<CourseModuleAttributes, 'id' | 'uuid'> {
}
export declare class CourseModule extends Model<CourseModuleAttributes, CourseModuleCreationAttributes> implements CourseModuleAttributes {
    id: bigint;
    uuid: string;
    courseId: bigint;
    moduleCode: string;
    moduleName: string;
    description?: string;
    sequence: number;
    duration: number;
    status: 'Draft' | 'Published' | 'Archived';
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof CourseModule;
}
export {};
//# sourceMappingURL=CourseModule.model.d.ts.map