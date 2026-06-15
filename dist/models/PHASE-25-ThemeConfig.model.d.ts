import { Model, Optional } from 'sequelize';
interface PHASE25_ThemeConfigAttributes {
    id: number;
    organizationId: number;
    themeName: string;
    isDarkMode: boolean;
    fontFamily: string;
    fontSize: number;
    colorScheme: any;
    layoutPreferences: any;
    componentStyles: any;
    isDefault: boolean;
    createdBy: number;
    updatedBy: number;
    createdAt: Date;
    updatedAt: Date;
}
interface PHASE25_ThemeConfigCreationAttributes extends Optional<PHASE25_ThemeConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class PHASE25_ThemeConfig extends Model<PHASE25_ThemeConfigAttributes, PHASE25_ThemeConfigCreationAttributes> implements PHASE25_ThemeConfigAttributes {
    id: number;
    organizationId: number;
    themeName: string;
    isDarkMode: boolean;
    fontFamily: string;
    fontSize: number;
    colorScheme: any;
    layoutPreferences: any;
    componentStyles: any;
    isDefault: boolean;
    createdBy: number;
    updatedBy: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default PHASE25_ThemeConfig;
//# sourceMappingURL=PHASE-25-ThemeConfig.model.d.ts.map