import { Model, Optional, Sequelize } from 'sequelize';
interface ModuleAttributes {
    id: bigint;
    uuid: string;
    name: string;
    code: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    isDefault: boolean;
    displayOrder: number;
}
interface ModuleCreationAttributes extends Optional<ModuleAttributes, 'id' | 'uuid' | 'isActive' | 'isDefault' | 'displayOrder'> {
}
export declare class AppModule extends Model<ModuleAttributes, ModuleCreationAttributes> implements ModuleAttributes {
    id: bigint;
    uuid: string;
    name: string;
    code: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    isDefault: boolean;
    displayOrder: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof AppModule;
}
export {};
//# sourceMappingURL=Module.model.d.ts.map