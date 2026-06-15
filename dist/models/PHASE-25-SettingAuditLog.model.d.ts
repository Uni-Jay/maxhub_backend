import { Model, Optional } from 'sequelize';
interface PHASE25_SettingAuditLogAttributes {
    id: number;
    organizationId: number;
    settingKey: string;
    oldValue: any;
    newValue: any;
    changedBy: number;
    reason: string;
    changeType: 'SYSTEM' | 'DEPARTMENT' | 'EMAIL' | 'BRANDING' | 'THEME' | 'INTEGRATION';
    ipAddress: string;
    userAgent: string;
    createdAt: Date;
}
interface PHASE25_SettingAuditLogCreationAttributes extends Optional<PHASE25_SettingAuditLogAttributes, 'id' | 'createdAt'> {
}
declare class PHASE25_SettingAuditLog extends Model<PHASE25_SettingAuditLogAttributes, PHASE25_SettingAuditLogCreationAttributes> implements PHASE25_SettingAuditLogAttributes {
    id: number;
    organizationId: number;
    settingKey: string;
    oldValue: any;
    newValue: any;
    changedBy: number;
    reason: string;
    changeType: 'SYSTEM' | 'DEPARTMENT' | 'EMAIL' | 'BRANDING' | 'THEME' | 'INTEGRATION';
    ipAddress: string;
    userAgent: string;
    readonly createdAt: Date;
}
export default PHASE25_SettingAuditLog;
//# sourceMappingURL=PHASE-25-SettingAuditLog.model.d.ts.map