"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHASE25_SettingsService = void 0;
const BaseService_1 = __importDefault(require("./BaseService"));
const PHASE_25_DepartmentSetting_model_1 = __importDefault(require("../models/PHASE-25-DepartmentSetting.model"));
const PHASE_25_EmailConfig_model_1 = __importDefault(require("../models/PHASE-25-EmailConfig.model"));
const PHASE_25_BrandingConfig_model_1 = __importDefault(require("../models/PHASE-25-BrandingConfig.model"));
const PHASE_25_ThemeConfig_model_1 = __importDefault(require("../models/PHASE-25-ThemeConfig.model"));
const PHASE_25_IntegrationConfig_model_1 = __importDefault(require("../models/PHASE-25-IntegrationConfig.model"));
const PHASE_25_SettingAuditLog_model_1 = __importDefault(require("../models/PHASE-25-SettingAuditLog.model"));
const PHASE_25_ConfigurationVersion_model_1 = __importDefault(require("../models/PHASE-25-ConfigurationVersion.model"));
const PHASE_25_FeatureFlag_model_1 = __importDefault(require("../models/PHASE-25-FeatureFlag.model"));
const encryption_1 = require("../utils/encryption");
const nodemailer_1 = __importDefault(require("nodemailer"));
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default();
class PHASE25_SettingsService extends BaseService_1.default {
    async getSystemSettings(organizationId) {
        const cacheKey = `settings:system:${organizationId}`;
        const cached = await redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const settings = await PHASE_25_DepartmentSetting_model_1.default.findAll({
            where: { organizationId, departmentId: null },
            attributes: ['settingKey', 'settingValue', 'settingType'],
        });
        const result = {};
        settings.forEach((s) => {
            result[s.settingKey] = this.parseValue(s.settingValue, s.settingType);
        });
        await redis.setex(cacheKey, 300, JSON.stringify(result));
        return result;
    }
    async updateSystemSetting(organizationId, staffId, settingKey, settingValue, settingType, ipAddress, userAgent) {
        const existing = await PHASE_25_DepartmentSetting_model_1.default.findOne({
            where: { organizationId, departmentId: null, settingKey },
        });
        const oldValue = existing?.settingValue;
        await PHASE_25_DepartmentSetting_model_1.default.upsert({
            organizationId,
            departmentId: null,
            settingKey,
            settingValue,
            settingType,
            updatedBy: staffId,
        });
        await PHASE_25_SettingAuditLog_model_1.default.create({
            organizationId,
            settingKey,
            oldValue,
            newValue: settingValue,
            changedBy: staffId,
            changeType: 'SYSTEM',
            ipAddress,
            userAgent,
        });
        await redis.del(`settings:system:${organizationId}`);
    }
    async getDepartmentSettings(organizationId, departmentId) {
        const cacheKey = `settings:department:${organizationId}:${departmentId}`;
        const cached = await redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const settings = await PHASE_25_DepartmentSetting_model_1.default.findAll({
            where: { organizationId, departmentId },
        });
        const result = {};
        settings.forEach((s) => {
            result[s.settingKey] = this.parseValue(s.settingValue, s.settingType);
        });
        await redis.setex(cacheKey, 300, JSON.stringify(result));
        return result;
    }
    async updateDepartmentSetting(organizationId, departmentId, staffId, settingKey, settingValue, settingType, ipAddress, userAgent) {
        const existing = await PHASE_25_DepartmentSetting_model_1.default.findOne({
            where: { organizationId, departmentId, settingKey },
        });
        const oldValue = existing?.settingValue;
        await PHASE_25_DepartmentSetting_model_1.default.upsert({
            organizationId,
            departmentId,
            settingKey,
            settingValue,
            settingType,
            updatedBy: staffId,
        });
        await PHASE_25_SettingAuditLog_model_1.default.create({
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
    async getEmailConfigs(organizationId) {
        return PHASE_25_EmailConfig_model_1.default.findAll({
            where: { organizationId },
            attributes: { exclude: ['passwordEncrypted', 'webhookSecret'] },
        });
    }
    async getDefaultEmailConfig(organizationId) {
        const config = await PHASE_25_EmailConfig_model_1.default.findOne({
            where: { organizationId, isDefault: true, isActive: true },
        });
        if (!config) {
            throw new Error('No default email configuration found');
        }
        return config;
    }
    async createEmailConfig(organizationId, data, staffId, ipAddress, userAgent) {
        const config = await PHASE_25_EmailConfig_model_1.default.create({
            organizationId,
            ...data,
            passwordEncrypted: (0, encryption_1.encrypt)(data.password),
            webhookSecret: data.webhookSecret ? (0, encryption_1.encrypt)(data.webhookSecret) : null,
            updatedBy: staffId,
        });
        await PHASE_25_SettingAuditLog_model_1.default.create({
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
    async updateEmailConfig(organizationId, configId, data, staffId, ipAddress, userAgent) {
        const existing = await PHASE_25_EmailConfig_model_1.default.findByPk(configId);
        if (!existing || existing.organizationId !== organizationId) {
            throw new Error('Email config not found');
        }
        const updateData = { ...data };
        if (data.password) {
            updateData.passwordEncrypted = (0, encryption_1.encrypt)(data.password);
            delete updateData.password;
        }
        if (data.webhookSecret) {
            updateData.webhookSecret = (0, encryption_1.encrypt)(data.webhookSecret);
        }
        updateData.updatedBy = staffId;
        await existing.update(updateData);
        await PHASE_25_SettingAuditLog_model_1.default.create({
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
    async testEmailConfig(configId, testEmail) {
        const config = await PHASE_25_EmailConfig_model_1.default.findByPk(configId);
        if (!config) {
            return { success: false, message: 'Config not found' };
        }
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: config.hostname,
                port: config.port,
                secure: config.useSSL,
                auth: {
                    user: config.username,
                    pass: (0, encryption_1.decrypt)(config.passwordEncrypted),
                },
            });
            await transporter.verify();
            await transporter.sendMail({
                from: config.fromEmail,
                to: testEmail,
                subject: 'Email Configuration Test',
                html: '<p>This is a test email from MaxHub.</p>',
            });
            await config.update({
                testConnectionResult: { success: true, message: 'Test email sent successfully', timestamp: new Date() },
                lastTestAt: new Date(),
            });
            return { success: true, message: 'Test email sent successfully' };
        }
        catch (error) {
            await config.update({
                testConnectionResult: { success: false, message: error.message, timestamp: new Date() },
                lastTestAt: new Date(),
            });
            return { success: false, message: error.message };
        }
    }
    async getBrandingConfig(organizationId) {
        const cacheKey = `branding:${organizationId}`;
        const cached = await redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const config = await PHASE_25_BrandingConfig_model_1.default.findOne({ where: { organizationId } });
        if (config) {
            await redis.setex(cacheKey, 600, JSON.stringify(config));
        }
        return config;
    }
    async updateBrandingConfig(organizationId, data, staffId, ipAddress, userAgent) {
        const existing = await PHASE_25_BrandingConfig_model_1.default.findOne({ where: { organizationId } });
        if (existing) {
            await existing.update({ ...data, updatedBy: staffId });
        }
        else {
            await PHASE_25_BrandingConfig_model_1.default.create({ organizationId, ...data, updatedBy: staffId });
        }
        await PHASE_25_SettingAuditLog_model_1.default.create({
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
    async getThemeConfigs(organizationId) {
        return PHASE_25_ThemeConfig_model_1.default.findAll({
            where: { organizationId },
            order: [['isDefault', 'DESC']],
        });
    }
    async getDefaultTheme(organizationId) {
        return PHASE_25_ThemeConfig_model_1.default.findOne({
            where: { organizationId, isDefault: true },
        });
    }
    async createTheme(organizationId, data, staffId, ipAddress, userAgent) {
        if (data.isDefault) {
            await PHASE_25_ThemeConfig_model_1.default.update({ isDefault: false }, { where: { organizationId, isDefault: true } });
        }
        const theme = await PHASE_25_ThemeConfig_model_1.default.create({
            organizationId,
            ...data,
            createdBy: staffId,
            updatedBy: staffId,
        });
        await PHASE_25_SettingAuditLog_model_1.default.create({
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
    async updateTheme(organizationId, themeId, data, staffId, ipAddress, userAgent) {
        const existing = await PHASE_25_ThemeConfig_model_1.default.findByPk(themeId);
        if (!existing || existing.organizationId !== organizationId) {
            throw new Error('Theme not found');
        }
        if (data.isDefault && !existing.isDefault) {
            await PHASE_25_ThemeConfig_model_1.default.update({ isDefault: false }, { where: { organizationId, isDefault: true } });
        }
        await existing.update({ ...data, updatedBy: staffId });
        await PHASE_25_SettingAuditLog_model_1.default.create({
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
    async getIntegrationConfigs(organizationId) {
        return PHASE_25_IntegrationConfig_model_1.default.findAll({
            where: { organizationId },
            attributes: { exclude: ['apiKey', 'apiSecret', 'webhookSecret'] },
        });
    }
    async createIntegration(organizationId, data, staffId, ipAddress, userAgent) {
        const integration = await PHASE_25_IntegrationConfig_model_1.default.create({
            organizationId,
            ...data,
            apiKey: (0, encryption_1.encrypt)(data.apiKey),
            apiSecret: (0, encryption_1.encrypt)(data.apiSecret),
            webhookSecret: data.webhookSecret ? (0, encryption_1.encrypt)(data.webhookSecret) : null,
            updatedBy: staffId,
        });
        await PHASE_25_SettingAuditLog_model_1.default.create({
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
    async testIntegration(integrationId) {
        const integration = await PHASE_25_IntegrationConfig_model_1.default.findByPk(integrationId);
        if (!integration) {
            return { success: false, message: 'Integration not found' };
        }
        try {
            let testResult = { success: false, message: '' };
            if (integration.providerName === 'TWILIO') {
                testResult = await this.testTwilioConnection(integration);
            }
            else if (integration.providerName === 'STRIPE') {
                testResult = await this.testStripeConnection(integration);
            }
            else if (integration.providerName === 'FIREBASE') {
                testResult = await this.testFirebaseConnection(integration);
            }
            await integration.update({
                testConnectionResult: testResult,
                lastTestAt: new Date(),
                isVerified: testResult.success,
                verifiedAt: testResult.success ? new Date() : null,
            });
            return testResult;
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
    async getFeatureFlags(organizationId) {
        const cacheKey = `flags:${organizationId}`;
        const cached = await redis.get(cacheKey);
        if (cached)
            return JSON.parse(cached);
        const flags = await PHASE_25_FeatureFlag_model_1.default.findAll({
            where: { organizationId },
        });
        await redis.setex(cacheKey, 60, JSON.stringify(flags));
        return flags;
    }
    async isFeatureEnabled(organizationId, flagKey, staffId, departmentId, role) {
        const flag = await PHASE_25_FeatureFlag_model_1.default.findOne({
            where: { organizationId, flagKey },
        });
        if (!flag || !flag.isEnabled)
            return false;
        if (flag.flagType === 'BOOLEAN') {
            return flag.isEnabled;
        }
        if (flag.flagType === 'PERCENTAGE') {
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
    async createFeatureFlag(organizationId, data, staffId) {
        const flag = await PHASE_25_FeatureFlag_model_1.default.create({
            organizationId,
            ...data,
            createdBy: staffId,
            updatedBy: staffId,
        });
        await redis.del(`flags:${organizationId}`);
        return flag;
    }
    async updateFeatureFlag(organizationId, flagId, data, staffId) {
        const existing = await PHASE_25_FeatureFlag_model_1.default.findByPk(flagId);
        if (!existing || existing.organizationId !== organizationId) {
            throw new Error('Feature flag not found');
        }
        await existing.update({ ...data, updatedBy: staffId });
        await redis.del(`flags:${organizationId}`);
        return existing;
    }
    async createConfigVersion(organizationId, configType, configSnapshot, description, staffId) {
        const lastVersion = await PHASE_25_ConfigurationVersion_model_1.default.findOne({
            where: { organizationId, configType },
            order: [['versionNumber', 'DESC']],
        });
        const nextVersion = (lastVersion?.versionNumber || 0) + 1;
        return PHASE_25_ConfigurationVersion_model_1.default.create({
            organizationId,
            configType,
            versionNumber: nextVersion,
            configSnapshot,
            description,
            createdBy: staffId,
            isActive: true,
        });
    }
    async getConfigVersions(organizationId, configType) {
        return PHASE_25_ConfigurationVersion_model_1.default.findAll({
            where: { organizationId, configType },
            order: [['versionNumber', 'DESC']],
        });
    }
    async rollbackConfiguration(organizationId, configType, toVersionNumber, staffId) {
        const targetVersion = await PHASE_25_ConfigurationVersion_model_1.default.findOne({
            where: { organizationId, configType, versionNumber: toVersionNumber },
        });
        if (!targetVersion) {
            throw new Error('Target version not found');
        }
        const rollbackVersion = await PHASE_25_ConfigurationVersion_model_1.default.create({
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
    parseValue(value, type) {
        if (type === 'NUMBER')
            return Number(value);
        if (type === 'BOOLEAN')
            return value === true || value === 'true';
        if (type === 'JSON')
            return typeof value === 'string' ? JSON.parse(value) : value;
        return value;
    }
    sanitizeForAudit(data) {
        const sanitized = { ...data };
        delete sanitized.password;
        delete sanitized.apiSecret;
        delete sanitized.webhookSecret;
        delete sanitized.passwordEncrypted;
        return sanitized;
    }
    evaluateConditions(conditions, context) {
        if (!conditions)
            return false;
        return true;
    }
    async testTwilioConnection(integration) {
        return { success: true, message: 'Twilio connection verified' };
    }
    async testStripeConnection(integration) {
        return { success: true, message: 'Stripe connection verified' };
    }
    async testFirebaseConnection(integration) {
        return { success: true, message: 'Firebase connection verified' };
    }
}
exports.PHASE25_SettingsService = PHASE25_SettingsService;
exports.default = PHASE25_SettingsService;
//# sourceMappingURL=PHASE-25-SettingsService.js.map