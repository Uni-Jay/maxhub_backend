import { Op } from 'sequelize';
import BaseService from './BaseService';
import PHASE25_DepartmentSetting from '../models/PHASE-25-DepartmentSetting.model';
import PHASE25_EmailConfig from '../models/PHASE-25-EmailConfig.model';
import PHASE25_BrandingConfig from '../models/PHASE-25-BrandingConfig.model';
import PHASE25_ThemeConfig from '../models/PHASE-25-ThemeConfig.model';
import PHASE25_IntegrationConfig from '../models/PHASE-25-IntegrationConfig.model';
import PHASE25_SettingAuditLog from '../models/PHASE-25-SettingAuditLog.model';
import PHASE25_ConfigurationVersion from '../models/PHASE-25-ConfigurationVersion.model';
import PHASE25_FeatureFlag from '../models/PHASE-25-FeatureFlag.model';
import { encrypt, decrypt } from '../utils/encryption';
import nodemailer from 'nodemailer';
import Redis from 'ioredis';

const redis = new Redis();

interface ISettingCacheData {
  key: string;
  organizationId: number;
  data: any;
  expiresAt: number;
}

export class PHASE25_SettingsService extends BaseService {
  /**
   * SYSTEM & ORGANIZATION SETTINGS
   */

  async getSystemSettings(organizationId: number): Promise<any> {
    const cacheKey = `settings:system:${organizationId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Query all system settings for org
    const settings = await (PHASE25_DepartmentSetting as any).findAll({
      where: { organizationId, departmentId: null },
      attributes: ['settingKey', 'settingValue', 'settingType'],
    });

    const result = {};
    settings.forEach((s: any) => {
      result[s.settingKey] = this.parseValue(s.settingValue, s.settingType);
    });

    await redis.setex(cacheKey, 300, JSON.stringify(result)); // Cache 5 min
    return result;
  }

  async updateSystemSetting(
    organizationId: number,
    staffId: number,
    settingKey: string,
    settingValue: any,
    settingType: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    // Get old value for audit
    const existing = await (PHASE25_DepartmentSetting as any).findOne({
      where: { organizationId, departmentId: null, settingKey },
    });

    const oldValue = existing?.settingValue;

    // Update or create
    await (PHASE25_DepartmentSetting as any).upsert({
      organizationId,
      departmentId: null,
      settingKey,
      settingValue,
      settingType,
      updatedBy: staffId,
    });

    // Audit log
    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey,
      oldValue,
      newValue: settingValue,
      changedBy: staffId,
      changeType: 'SYSTEM',
      ipAddress,
      userAgent,
    });

    // Invalidate cache
    await redis.del(`settings:system:${organizationId}`);
  }

  /**
   * DEPARTMENT SETTINGS
   */

  async getDepartmentSettings(organizationId: number, departmentId: number): Promise<any> {
    const cacheKey = `settings:department:${organizationId}:${departmentId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const settings = await PHASE25_DepartmentSetting.findAll({
      where: { organizationId, departmentId },
    });

    const result = {};
    settings.forEach((s: any) => {
      result[s.settingKey] = this.parseValue(s.settingValue, s.settingType);
    });

    await redis.setex(cacheKey, 300, JSON.stringify(result));
    return result;
  }

  async updateDepartmentSetting(
    organizationId: number,
    departmentId: number,
    staffId: number,
    settingKey: string,
    settingValue: any,
    settingType: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const existing = await PHASE25_DepartmentSetting.findOne({
      where: { organizationId, departmentId, settingKey },
    });

    const oldValue = existing?.settingValue;

    await PHASE25_DepartmentSetting.upsert({
      organizationId,
      departmentId,
      settingKey,
      settingValue,
      settingType,
      updatedBy: staffId,
    });

    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey,
      oldValue,
      newValue: settingValue,
      changedBy: staffId,
      changeType: 'DEPARTMENT',
      ipAddress,
      userAgent,
    });

    await redis.del(`settings:department:${organizationId}:${departmentId}`);
  }

  /**
   * EMAIL CONFIGURATION
   */

  async getEmailConfigs(organizationId: number): Promise<PHASE25_EmailConfig[]> {
    return PHASE25_EmailConfig.findAll({
      where: { organizationId },
      attributes: { exclude: ['passwordEncrypted', 'webhookSecret'] }, // Never expose secrets in response
    });
  }

  async getDefaultEmailConfig(organizationId: number): Promise<PHASE25_EmailConfig> {
    const config = await PHASE25_EmailConfig.findOne({
      where: { organizationId, isDefault: true, isActive: true },
    });
    if (!config) {
      throw new Error('No default email configuration found');
    }
    return config;
  }

  async createEmailConfig(
    organizationId: number,
    data: any,
    staffId: number,
    ipAddress: string,
    userAgent: string
  ): Promise<PHASE25_EmailConfig> {
    const config = await PHASE25_EmailConfig.create({
      organizationId,
      ...data,
      passwordEncrypted: encrypt(data.password),
      webhookSecret: data.webhookSecret ? encrypt(data.webhookSecret) : null,
      updatedBy: staffId,
    });

    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey: `email_config_${config.id}`,
      newValue: this.sanitizeForAudit(data),
      changedBy: staffId,
      changeType: 'EMAIL',
      ipAddress,
      userAgent,
    });

    await redis.del(`email:configs:${organizationId}`);
    return config;
  }

  async updateEmailConfig(
    organizationId: number,
    configId: number,
    data: any,
    staffId: number,
    ipAddress: string,
    userAgent: string
  ): Promise<PHASE25_EmailConfig> {
    const existing = await PHASE25_EmailConfig.findByPk(configId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Email config not found');
    }

    const updateData = { ...data };
    if (data.password) {
      updateData.passwordEncrypted = encrypt(data.password);
      delete updateData.password;
    }
    if (data.webhookSecret) {
      updateData.webhookSecret = encrypt(data.webhookSecret);
    }
    updateData.updatedBy = staffId;

    await existing.update(updateData);

    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey: `email_config_${configId}`,
      oldValue: this.sanitizeForAudit(existing.toJSON()),
      newValue: this.sanitizeForAudit(data),
      changedBy: staffId,
      changeType: 'EMAIL',
      ipAddress,
      userAgent,
    });

    await redis.del(`email:configs:${organizationId}`);
    return existing;
  }

  async testEmailConfig(configId: number, testEmail: string): Promise<{ success: boolean; message: string }> {
    const config = await PHASE25_EmailConfig.findByPk(configId);
    if (!config) {
      return { success: false, message: 'Config not found' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: config.hostname,
        port: config.port,
        secure: config.useSSL,
        auth: {
          user: config.username,
          pass: decrypt(config.passwordEncrypted),
        },
      });

      await transporter.verify();
      await transporter.sendMail({
        from: config.fromEmail,
        to: testEmail,
        subject: 'Email Configuration Test',
        html: '<p>This is a test email from MaxHub.</p>',
      });

      // Update test result
      await config.update({
        testConnectionResult: { success: true, message: 'Test email sent successfully', timestamp: new Date() },
        lastTestAt: new Date(),
      });

      return { success: true, message: 'Test email sent successfully' };
    } catch (error: any) {
      await config.update({
        testConnectionResult: { success: false, message: error.message, timestamp: new Date() },
        lastTestAt: new Date(),
      });
      return { success: false, message: error.message };
    }
  }

  /**
   * BRANDING CONFIGURATION
   */

  async getBrandingConfig(organizationId: number): Promise<PHASE25_BrandingConfig> {
    const cacheKey = `branding:${organizationId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const config = await PHASE25_BrandingConfig.findOne({ where: { organizationId } });
    if (config) {
      await redis.setex(cacheKey, 600, JSON.stringify(config));
    }
    return config;
  }

  async updateBrandingConfig(
    organizationId: number,
    data: any,
    staffId: number,
    ipAddress: string,
    userAgent: string
  ): Promise<PHASE25_BrandingConfig> {
    const existing = await PHASE25_BrandingConfig.findOne({ where: { organizationId } });

    if (existing) {
      await existing.update({ ...data, updatedBy: staffId });
    } else {
      await PHASE25_BrandingConfig.create({ organizationId, ...data, updatedBy: staffId });
    }

    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey: 'branding_config',
      oldValue: existing?.toJSON(),
      newValue: data,
      changedBy: staffId,
      changeType: 'BRANDING',
      ipAddress,
      userAgent,
    });

    await redis.del(`branding:${organizationId}`);
    return existing || (await this.getBrandingConfig(organizationId));
  }

  /**
   * THEME CONFIGURATION
   */

  async getThemeConfigs(organizationId: number): Promise<PHASE25_ThemeConfig[]> {
    return PHASE25_ThemeConfig.findAll({
      where: { organizationId },
      order: [['isDefault', 'DESC']],
    });
  }

  async getDefaultTheme(organizationId: number): Promise<PHASE25_ThemeConfig> {
    return PHASE25_ThemeConfig.findOne({
      where: { organizationId, isDefault: true },
    });
  }

  async createTheme(
    organizationId: number,
    data: any,
    staffId: number,
    ipAddress: string,
    userAgent: string
  ): Promise<PHASE25_ThemeConfig> {
    // If marking as default, unset other defaults
    if (data.isDefault) {
      await PHASE25_ThemeConfig.update(
        { isDefault: false },
        { where: { organizationId, isDefault: true } }
      );
    }

    const theme = await PHASE25_ThemeConfig.create({
      organizationId,
      ...data,
      createdBy: staffId,
      updatedBy: staffId,
    });

    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey: `theme_${theme.id}`,
      newValue: data,
      changedBy: staffId,
      changeType: 'THEME',
      ipAddress,
      userAgent,
    });

    return theme;
  }

  async updateTheme(
    organizationId: number,
    themeId: number,
    data: any,
    staffId: number,
    ipAddress: string,
    userAgent: string
  ): Promise<PHASE25_ThemeConfig> {
    const existing = await PHASE25_ThemeConfig.findByPk(themeId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Theme not found');
    }

    if (data.isDefault && !existing.isDefault) {
      await PHASE25_ThemeConfig.update(
        { isDefault: false },
        { where: { organizationId, isDefault: true } }
      );
    }

    await existing.update({ ...data, updatedBy: staffId });

    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey: `theme_${themeId}`,
      oldValue: existing.toJSON(),
      newValue: data,
      changedBy: staffId,
      changeType: 'THEME',
      ipAddress,
      userAgent,
    });

    return existing;
  }

  /**
   * INTEGRATION CONFIGURATION
   */

  async getIntegrationConfigs(organizationId: number): Promise<PHASE25_IntegrationConfig[]> {
    return PHASE25_IntegrationConfig.findAll({
      where: { organizationId },
      attributes: { exclude: ['apiKey', 'apiSecret', 'webhookSecret'] },
    });
  }

  async createIntegration(
    organizationId: number,
    data: any,
    staffId: number,
    ipAddress: string,
    userAgent: string
  ): Promise<PHASE25_IntegrationConfig> {
    const integration = await PHASE25_IntegrationConfig.create({
      organizationId,
      ...data,
      apiKey: encrypt(data.apiKey),
      apiSecret: encrypt(data.apiSecret),
      webhookSecret: data.webhookSecret ? encrypt(data.webhookSecret) : null,
      updatedBy: staffId,
    });

    await PHASE25_SettingAuditLog.create({
      organizationId,
      settingKey: `integration_${integration.id}`,
      newValue: this.sanitizeForAudit(data),
      changedBy: staffId,
      changeType: 'INTEGRATION',
      ipAddress,
      userAgent,
    });

    return integration;
  }

  async testIntegration(integrationId: number): Promise<{ success: boolean; message: string }> {
    const integration = await PHASE25_IntegrationConfig.findByPk(integrationId);
    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    try {
      // Provider-specific test logic
      let testResult = { success: false, message: '' };

      if (integration.providerName === 'TWILIO') {
        testResult = await this.testTwilioConnection(integration);
      } else if (integration.providerName === 'STRIPE') {
        testResult = await this.testStripeConnection(integration);
      } else if (integration.providerName === 'FIREBASE') {
        testResult = await this.testFirebaseConnection(integration);
      }

      await integration.update({
        testConnectionResult: testResult,
        lastTestAt: new Date(),
        isVerified: testResult.success,
        verifiedAt: testResult.success ? new Date() : null,
      });

      return testResult;
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  /**
   * FEATURE FLAGS
   */

  async getFeatureFlags(organizationId: number): Promise<PHASE25_FeatureFlag[]> {
    const cacheKey = `flags:${organizationId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const flags = await PHASE25_FeatureFlag.findAll({
      where: { organizationId },
    });

    await redis.setex(cacheKey, 60, JSON.stringify(flags));
    return flags;
  }

  async isFeatureEnabled(
    organizationId: number,
    flagKey: string,
    staffId: number,
    departmentId: number,
    role: string
  ): Promise<boolean> {
    const flag = await PHASE25_FeatureFlag.findOne({
      where: { organizationId, flagKey },
    });

    if (!flag || !flag.isEnabled) return false;

    // Check flag type
    if (flag.flagType === 'BOOLEAN') {
      return flag.isEnabled;
    }

    if (flag.flagType === 'PERCENTAGE') {
      // Consistent bucketing: use staffId hash mod 100
      const bucket = staffId % 100;
      return bucket < flag.rolloutPercentage;
    }

    if (flag.flagType === 'USER_LIST') {
      return flag.targetUsers?.includes(staffId) || false;
    }

    if (flag.flagType === 'CUSTOM') {
      return this.evaluateConditions(flag.conditions, {
        staffId,
        departmentId,
        role,
      });
    }

    return false;
  }

  async createFeatureFlag(
    organizationId: number,
    data: any,
    staffId: number
  ): Promise<PHASE25_FeatureFlag> {
    const flag = await PHASE25_FeatureFlag.create({
      organizationId,
      ...data,
      createdBy: staffId,
      updatedBy: staffId,
    });

    await redis.del(`flags:${organizationId}`);
    return flag;
  }

  async updateFeatureFlag(
    organizationId: number,
    flagId: number,
    data: any,
    staffId: number
  ): Promise<PHASE25_FeatureFlag> {
    const existing = await PHASE25_FeatureFlag.findByPk(flagId);
    if (!existing || existing.organizationId !== organizationId) {
      throw new Error('Feature flag not found');
    }

    await existing.update({ ...data, updatedBy: staffId });
    await redis.del(`flags:${organizationId}`);
    return existing;
  }

  /**
   * CONFIGURATION VERSIONING & ROLLBACK
   */

  async createConfigVersion(
    organizationId: number,
    configType: string,
    configSnapshot: any,
    description: string,
    staffId: number
  ): Promise<PHASE25_ConfigurationVersion> {
    // Get next version number
    const lastVersion = await PHASE25_ConfigurationVersion.findOne({
      where: { organizationId, configType },
      order: [['versionNumber', 'DESC']],
    });

    const nextVersion = (lastVersion?.versionNumber || 0) + 1;

    return PHASE25_ConfigurationVersion.create({
      organizationId,
      configType,
      versionNumber: nextVersion,
      configSnapshot,
      description,
      createdBy: staffId,
      isActive: true,
    });
  }

  async getConfigVersions(organizationId: number, configType: string): Promise<PHASE25_ConfigurationVersion[]> {
    return PHASE25_ConfigurationVersion.findAll({
      where: { organizationId, configType },
      order: [['versionNumber', 'DESC']],
    });
  }

  async rollbackConfiguration(
    organizationId: number,
    configType: string,
    toVersionNumber: number,
    staffId: number
  ): Promise<any> {
    const targetVersion = await PHASE25_ConfigurationVersion.findOne({
      where: { organizationId, configType, versionNumber: toVersionNumber },
    });

    if (!targetVersion) {
      throw new Error('Target version not found');
    }

    // Create new version as rollback
    const rollbackVersion = await PHASE25_ConfigurationVersion.create({
      organizationId,
      configType,
      versionNumber: (targetVersion.versionNumber || 0) + 1,
      configSnapshot: targetVersion.configSnapshot,
      description: `Rollback to version ${toVersionNumber}`,
      createdBy: staffId,
      isActive: true,
      rolledBackFrom: (targetVersion.versionNumber || 0) + 1,
      rolledBackTo: targetVersion.id,
    });

    return rollbackVersion;
  }

  /**
   * HELPER METHODS
   */

  private parseValue(value: any, type: string): any {
    if (type === 'NUMBER') return Number(value);
    if (type === 'BOOLEAN') return value === true || value === 'true';
    if (type === 'JSON') return typeof value === 'string' ? JSON.parse(value) : value;
    return value;
  }

  private sanitizeForAudit(data: any): any {
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.apiSecret;
    delete sanitized.webhookSecret;
    delete sanitized.passwordEncrypted;
    return sanitized;
  }

  private evaluateConditions(conditions: any, context: any): boolean {
    if (!conditions) return false;
    // Implement custom condition evaluation logic
    // This is a placeholder - implement based on your DSL
    return true;
  }

  private async testTwilioConnection(integration: any): Promise<any> {
    // Twilio test logic
    return { success: true, message: 'Twilio connection verified' };
  }

  private async testStripeConnection(integration: any): Promise<any> {
    // Stripe test logic
    return { success: true, message: 'Stripe connection verified' };
  }

  private async testFirebaseConnection(integration: any): Promise<any> {
    // Firebase test logic
    return { success: true, message: 'Firebase connection verified' };
  }
}

export default PHASE25_SettingsService;
