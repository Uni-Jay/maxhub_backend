import { Model, Optional, Sequelize } from 'sequelize';
interface SystemSettingAttributes {
    id: bigint;
    uuid: string;
    settingKey: string;
    settingValue: string;
    description?: string;
    category: string;
    dataType: 'String' | 'Number' | 'Boolean' | 'JSON';
    isEditable: boolean;
    deletedAt?: Date;
}
interface SystemSettingCreationAttributes extends Optional<SystemSettingAttributes, 'id' | 'uuid'> {
}
export declare class SystemSetting extends Model<SystemSettingAttributes, SystemSettingCreationAttributes> implements SystemSettingAttributes {
    id: bigint;
    uuid: string;
    settingKey: string;
    settingValue: string;
    description?: string;
    category: string;
    dataType: 'String' | 'Number' | 'Boolean' | 'JSON';
    isEditable: boolean;
    deletedAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    static initModel(sequelize: Sequelize): typeof SystemSetting;
}
export {};
//# sourceMappingURL=SystemSetting.model.d.ts.map