import { Model, Optional } from 'sequelize';
interface PHASE25_DepartmentSettingAttributes {
    id: number;
    organizationId: number;
    departmentId: number;
    settingKey: string;
    settingValue: any;
    settingType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE';
    updatedBy: number;
    createdAt: Date;
    updatedAt: Date;
}
interface PHASE25_DepartmentSettingCreationAttributes extends Optional<PHASE25_DepartmentSettingAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class PHASE25_DepartmentSetting extends Model<PHASE25_DepartmentSettingAttributes, PHASE25_DepartmentSettingCreationAttributes> implements PHASE25_DepartmentSettingAttributes {
    id: number;
    organizationId: number;
    departmentId: number;
    settingKey: string;
    settingValue: any;
    settingType: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE';
    updatedBy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default PHASE25_DepartmentSetting;
//# sourceMappingURL=PHASE-25-DepartmentSetting.model.d.ts.map