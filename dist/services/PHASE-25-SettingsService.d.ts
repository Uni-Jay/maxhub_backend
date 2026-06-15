import BaseService from './BaseService';
import PHASE25_EmailConfig from '../models/PHASE-25-EmailConfig.model';
import PHASE25_BrandingConfig from '../models/PHASE-25-BrandingConfig.model';
import PHASE25_ThemeConfig from '../models/PHASE-25-ThemeConfig.model';
import PHASE25_IntegrationConfig from '../models/PHASE-25-IntegrationConfig.model';
import PHASE25_ConfigurationVersion from '../models/PHASE-25-ConfigurationVersion.model';
import PHASE25_FeatureFlag from '../models/PHASE-25-FeatureFlag.model';
export declare class PHASE25_SettingsService extends BaseService {
    getSystemSettings(organizationId: number): Promise<any>;
    updateSystemSetting(organizationId: number, staffId: number, settingKey: string, settingValue: any, settingType: string, ipAddress: string, userAgent: string): Promise<void>;
    getDepartmentSettings(organizationId: number, departmentId: number): Promise<any>;
    updateDepartmentSetting(organizationId: number, departmentId: number, staffId: number, settingKey: string, settingValue: any, settingType: string, ipAddress: string, userAgent: string): Promise<void>;
    getEmailConfigs(organizationId: number): Promise<PHASE25_EmailConfig[]>;
    getDefaultEmailConfig(organizationId: number): Promise<PHASE25_EmailConfig>;
    createEmailConfig(organizationId: number, data: any, staffId: number, ipAddress: string, userAgent: string): Promise<PHASE25_EmailConfig>;
    updateEmailConfig(organizationId: number, configId: number, data: any, staffId: number, ipAddress: string, userAgent: string): Promise<PHASE25_EmailConfig>;
    testEmailConfig(configId: number, testEmail: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getBrandingConfig(organizationId: number): Promise<PHASE25_BrandingConfig>;
    updateBrandingConfig(organizationId: number, data: any, staffId: number, ipAddress: string, userAgent: string): Promise<PHASE25_BrandingConfig>;
    getThemeConfigs(organizationId: number): Promise<PHASE25_ThemeConfig[]>;
    getDefaultTheme(organizationId: number): Promise<PHASE25_ThemeConfig>;
    createTheme(organizationId: number, data: any, staffId: number, ipAddress: string, userAgent: string): Promise<PHASE25_ThemeConfig>;
    updateTheme(organizationId: number, themeId: number, data: any, staffId: number, ipAddress: string, userAgent: string): Promise<PHASE25_ThemeConfig>;
    getIntegrationConfigs(organizationId: number): Promise<PHASE25_IntegrationConfig[]>;
    createIntegration(organizationId: number, data: any, staffId: number, ipAddress: string, userAgent: string): Promise<PHASE25_IntegrationConfig>;
    testIntegration(integrationId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    getFeatureFlags(organizationId: number): Promise<PHASE25_FeatureFlag[]>;
    isFeatureEnabled(organizationId: number, flagKey: string, staffId: number, departmentId: number, role: string): Promise<boolean>;
    createFeatureFlag(organizationId: number, data: any, staffId: number): Promise<PHASE25_FeatureFlag>;
    updateFeatureFlag(organizationId: number, flagId: number, data: any, staffId: number): Promise<PHASE25_FeatureFlag>;
    createConfigVersion(organizationId: number, configType: string, configSnapshot: any, description: string, staffId: number): Promise<PHASE25_ConfigurationVersion>;
    getConfigVersions(organizationId: number, configType: string): Promise<PHASE25_ConfigurationVersion[]>;
    rollbackConfiguration(organizationId: number, configType: string, toVersionNumber: number, staffId: number): Promise<any>;
    private parseValue;
    private sanitizeForAudit;
    private evaluateConditions;
    private testTwilioConnection;
    private testStripeConnection;
    private testFirebaseConnection;
}
export default PHASE25_SettingsService;
//# sourceMappingURL=PHASE-25-SettingsService.d.ts.map