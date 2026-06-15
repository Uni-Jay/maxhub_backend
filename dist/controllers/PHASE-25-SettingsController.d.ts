import { Request, Response } from 'express';
import BaseController from './BaseController';
export declare class PHASE25_SettingsController extends BaseController {
    getSystemSettings(req: Request, res: Response): Promise<void>;
    updateSystemSetting(req: Request, res: Response): Promise<void>;
    getDepartmentSettings(req: Request, res: Response): Promise<void>;
    updateDepartmentSetting(req: Request, res: Response): Promise<void>;
    getEmailConfigs(req: Request, res: Response): Promise<void>;
    createEmailConfig(req: Request, res: Response): Promise<void>;
    updateEmailConfig(req: Request, res: Response): Promise<void>;
    testEmailConfig(req: Request, res: Response): Promise<void>;
    getBrandingConfig(req: Request, res: Response): Promise<void>;
    updateBrandingConfig(req: Request, res: Response): Promise<void>;
    getThemeConfigs(req: Request, res: Response): Promise<void>;
    getDefaultTheme(req: Request, res: Response): Promise<void>;
    createTheme(req: Request, res: Response): Promise<void>;
    updateTheme(req: Request, res: Response): Promise<void>;
    getIntegrationConfigs(req: Request, res: Response): Promise<void>;
    createIntegration(req: Request, res: Response): Promise<void>;
    testIntegration(req: Request, res: Response): Promise<void>;
    getFeatureFlags(req: Request, res: Response): Promise<void>;
    checkFeatureFlag(req: Request, res: Response): Promise<void>;
    createFeatureFlag(req: Request, res: Response): Promise<void>;
    updateFeatureFlag(req: Request, res: Response): Promise<void>;
    getConfigVersions(req: Request, res: Response): Promise<void>;
    rollbackConfiguration(req: Request, res: Response): Promise<void>;
    getSettingAuditLog(req: Request, res: Response): Promise<void>;
}
export default PHASE25_SettingsController;
//# sourceMappingURL=PHASE-25-SettingsController.d.ts.map