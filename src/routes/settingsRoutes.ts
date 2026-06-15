import { Router } from 'express';
import PHASE25_SettingsController from '../controllers/PHASE-25-SettingsController';
import AuthMiddleware from '../middleware/AuthMiddleware';

const router = Router();
const controller = new PHASE25_SettingsController();

/**
 * SYSTEM SETTINGS ROUTES
 */
router.get('/:organizationId/system', (req, res) => controller.getSystemSettings(req, res));
router.put('/:organizationId/system/:settingKey', AuthMiddleware.requirePermission('settings.system.update.all'), (req, res) => controller.updateSystemSetting(req, res));

/**
 * DEPARTMENT SETTINGS ROUTES
 */
router.get('/:organizationId/department/:departmentId', (req, res) => controller.getDepartmentSettings(req, res));
router.put('/:organizationId/department/:departmentId/:settingKey', AuthMiddleware.requirePermission('settings.department.update.all'), (req, res) => controller.updateDepartmentSetting(req, res));

/**
 * EMAIL CONFIGURATION ROUTES
 */
router.get('/:organizationId/email/configs', AuthMiddleware.requirePermission('settings.email.read.all'), (req, res) => controller.getEmailConfigs(req, res));
router.post('/:organizationId/email/configs', AuthMiddleware.requirePermission('settings.email.create.all'), (req, res) => controller.createEmailConfig(req, res));
router.put('/:organizationId/email/configs/:configId', AuthMiddleware.requirePermission('settings.email.update.all'), (req, res) => controller.updateEmailConfig(req, res));
router.post('/:organizationId/email/configs/:configId/test', AuthMiddleware.requirePermission('settings.email.test.all'), (req, res) => controller.testEmailConfig(req, res));

/**
 * BRANDING CONFIGURATION ROUTES
 */
router.get('/:organizationId/branding', (req, res) => controller.getBrandingConfig(req, res));
router.put('/:organizationId/branding', AuthMiddleware.requirePermission('settings.branding.update.all'), (req, res) => controller.updateBrandingConfig(req, res));

/**
 * THEME CONFIGURATION ROUTES
 */
router.get('/:organizationId/themes', (req, res) => controller.getThemeConfigs(req, res));
router.get('/:organizationId/themes/default', (req, res) => controller.getDefaultTheme(req, res));
router.post('/:organizationId/themes', AuthMiddleware.requirePermission('settings.theme.create.all'), (req, res) => controller.createTheme(req, res));
router.put('/:organizationId/themes/:themeId', AuthMiddleware.requirePermission('settings.theme.update.all'), (req, res) => controller.updateTheme(req, res));

/**
 * INTEGRATION CONFIGURATION ROUTES
 */
router.get('/:organizationId/integrations', AuthMiddleware.requirePermission('settings.integration.read.all'), (req, res) => controller.getIntegrationConfigs(req, res));
router.post('/:organizationId/integrations', AuthMiddleware.requirePermission('settings.integration.create.all'), (req, res) => controller.createIntegration(req, res));
router.post('/:organizationId/integrations/:integrationId/test', AuthMiddleware.requirePermission('settings.integration.test.all'), (req, res) => controller.testIntegration(req, res));

/**
 * FEATURE FLAGS ROUTES
 */
router.get('/:organizationId/flags', (req, res) => controller.getFeatureFlags(req, res));
router.post('/:organizationId/flags/check', (req, res) => controller.checkFeatureFlag(req, res));
router.post('/:organizationId/flags', AuthMiddleware.requirePermission('settings.feature.create.all'), (req, res) => controller.createFeatureFlag(req, res));
router.put('/:organizationId/flags/:flagId', AuthMiddleware.requirePermission('settings.feature.update.all'), (req, res) => controller.updateFeatureFlag(req, res));

/**
 * CONFIGURATION VERSIONING & ROLLBACK ROUTES
 */
router.get('/:organizationId/versions/:configType', AuthMiddleware.requirePermission('settings.version.read.all'), (req, res) => controller.getConfigVersions(req, res));
router.post('/:organizationId/versions/:configType/rollback', AuthMiddleware.requirePermission('settings.version.rollback.all'), (req, res) => controller.rollbackConfiguration(req, res));

/**
 * AUDIT LOG ROUTES
 */
router.get('/:organizationId/audit-logs', AuthMiddleware.requirePermission('settings.audit.read.all'), (req, res) => controller.getSettingAuditLog(req, res));

export default router;
