"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PHASE25_SettingsController = void 0;
const BaseController_1 = __importDefault(require("./BaseController"));
const PHASE_25_SettingsService_1 = __importDefault(require("../services/PHASE-25-SettingsService"));
const settingsService = new PHASE_25_SettingsService_1.default();
class PHASE25_SettingsController extends BaseController_1.default {
    async getSystemSettings(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.system.read.all');
            const settings = await settingsService.getSystemSettings(Number(organizationId));
            this.sendSuccess(res, settings, 'System settings retrieved');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async updateSystemSetting(req, res) {
        try {
            const { organizationId } = req.params;
            const { settingKey, settingValue, settingType, reason } = req.body;
            await this.checkPermission(req.user.id, 'settings.system.update.all');
            await settingsService.updateSystemSetting(Number(organizationId), req.user.id, settingKey, settingValue, settingType, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, null, 'System setting updated');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getDepartmentSettings(req, res) {
        try {
            const { organizationId, departmentId } = req.params;
            await this.checkPermission(req.user.id, 'settings.department.read.all');
            const settings = await settingsService.getDepartmentSettings(Number(organizationId), Number(departmentId));
            this.sendSuccess(res, settings);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async updateDepartmentSetting(req, res) {
        try {
            const { organizationId, departmentId } = req.params;
            const { settingKey, settingValue, settingType } = req.body;
            await this.checkPermission(req.user.id, 'settings.department.update.all');
            await settingsService.updateDepartmentSetting(Number(organizationId), Number(departmentId), req.user.id, settingKey, settingValue, settingType, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, null, 'Department setting updated');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getEmailConfigs(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.email.read.all');
            const configs = await settingsService.getEmailConfigs(Number(organizationId));
            this.sendSuccess(res, configs);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async createEmailConfig(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.email.create.all');
            const config = await settingsService.createEmailConfig(Number(organizationId), req.body, req.user.id, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, config, 'Email configuration created', 201);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async updateEmailConfig(req, res) {
        try {
            const { organizationId, configId } = req.params;
            await this.checkPermission(req.user.id, 'settings.email.update.all');
            const config = await settingsService.updateEmailConfig(Number(organizationId), Number(configId), req.body, req.user.id, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, config, 'Email configuration updated');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async testEmailConfig(req, res) {
        try {
            const { configId } = req.params;
            const { testEmail } = req.body;
            await this.checkPermission(req.user.id, 'settings.email.test.all');
            const result = await settingsService.testEmailConfig(Number(configId), testEmail);
            this.sendSuccess(res, result);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getBrandingConfig(req, res) {
        try {
            const { organizationId } = req.params;
            const branding = await settingsService.getBrandingConfig(Number(organizationId));
            this.sendSuccess(res, branding);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async updateBrandingConfig(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.branding.update.all');
            const branding = await settingsService.updateBrandingConfig(Number(organizationId), req.body, req.user.id, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, branding, 'Branding configuration updated');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getThemeConfigs(req, res) {
        try {
            const { organizationId } = req.params;
            const themes = await settingsService.getThemeConfigs(Number(organizationId));
            this.sendSuccess(res, themes);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getDefaultTheme(req, res) {
        try {
            const { organizationId } = req.params;
            const theme = await settingsService.getDefaultTheme(Number(organizationId));
            this.sendSuccess(res, theme);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async createTheme(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.theme.create.all');
            const theme = await settingsService.createTheme(Number(organizationId), req.body, req.user.id, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, theme, 'Theme created', 201);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async updateTheme(req, res) {
        try {
            const { organizationId, themeId } = req.params;
            await this.checkPermission(req.user.id, 'settings.theme.update.all');
            const theme = await settingsService.updateTheme(Number(organizationId), Number(themeId), req.body, req.user.id, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, theme, 'Theme updated');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getIntegrationConfigs(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.integration.read.all');
            const integrations = await settingsService.getIntegrationConfigs(Number(organizationId));
            this.sendSuccess(res, integrations);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async createIntegration(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.integration.create.all');
            const integration = await settingsService.createIntegration(Number(organizationId), req.body, req.user.id, req.ip || '', req.get('user-agent') || '');
            this.sendSuccess(res, integration, 'Integration created', 201);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async testIntegration(req, res) {
        try {
            const { integrationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.integration.test.all');
            const result = await settingsService.testIntegration(Number(integrationId));
            this.sendSuccess(res, result);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getFeatureFlags(req, res) {
        try {
            const { organizationId } = req.params;
            const flags = await settingsService.getFeatureFlags(Number(organizationId));
            this.sendSuccess(res, flags);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async checkFeatureFlag(req, res) {
        try {
            const { organizationId } = req.params;
            const { flagKey } = req.body;
            const isEnabled = await settingsService.isFeatureEnabled(Number(organizationId), flagKey, req.user.id, req.user.departmentId, req.user.role);
            this.sendSuccess(res, { flagKey, isEnabled });
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async createFeatureFlag(req, res) {
        try {
            const { organizationId } = req.params;
            await this.checkPermission(req.user.id, 'settings.feature.create.all');
            const flag = await settingsService.createFeatureFlag(Number(organizationId), req.body, req.user.id);
            this.sendSuccess(res, flag, 'Feature flag created', 201);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async updateFeatureFlag(req, res) {
        try {
            const { organizationId, flagId } = req.params;
            await this.checkPermission(req.user.id, 'settings.feature.update.all');
            const flag = await settingsService.updateFeatureFlag(Number(organizationId), Number(flagId), req.body, req.user.id);
            this.sendSuccess(res, flag, 'Feature flag updated');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getConfigVersions(req, res) {
        try {
            const { organizationId, configType } = req.params;
            await this.checkPermission(req.user.id, 'settings.version.read.all');
            const versions = await settingsService.getConfigVersions(Number(organizationId), configType);
            this.sendSuccess(res, versions);
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async rollbackConfiguration(req, res) {
        try {
            const { organizationId, configType } = req.params;
            const { toVersionNumber } = req.body;
            await this.checkPermission(req.user.id, 'settings.version.rollback.all');
            const result = await settingsService.rollbackConfiguration(Number(organizationId), configType, toVersionNumber, req.user.id);
            this.sendSuccess(res, result, 'Configuration rolled back');
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
    async getSettingAuditLog(req, res) {
        try {
            const { organizationId } = req.params;
            const { limit = 50, offset = 0, settingKey } = req.query;
            await this.checkPermission(req.user.id, 'settings.audit.read.all');
            const auditLogs = await (require('../models/PHASE-25-SettingAuditLog.model').default).findAndCountAll({
                where: { organizationId, ...(settingKey && { settingKey }) },
                limit: Number(limit),
                offset: Number(offset),
                order: [['createdAt', 'DESC']],
            });
            this.sendPaginated(res, auditLogs.rows, auditLogs.count, Number(offset), Number(limit));
        }
        catch (error) {
            this.sendError(res, error);
        }
    }
}
exports.PHASE25_SettingsController = PHASE25_SettingsController;
exports.default = PHASE25_SettingsController;
//# sourceMappingURL=PHASE-25-SettingsController.js.map