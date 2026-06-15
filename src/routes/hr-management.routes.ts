import { Router, Request, Response } from 'express';
import AuthMiddleware from '../middleware/AuthMiddleware';
import { PermissionCode } from '../config/PermissionCodes';
import { HRService, WarningRequest, ResignationRequest, PromotionRequest } from '../services/HRService';

const router = Router();
const hrService = new HRService();

router.post(
  '/warnings/issue',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_WARNING_CREATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const warningData: WarningRequest = req.body;
      const result = await hrService.issueWarning(req, warningData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/warnings/:id/acknowledge',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_WARNING_READ_OWN),
  async (req: Request, res: Response) => {
    try {
      const warningId = BigInt(req.params.id);
      const staffId = (req as any).user.staffId;
      const result = await hrService.acknowledgeWarning(req, warningId, staffId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.post(
  '/resignation/submit',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_RESIGNATION_CREATE_OWN),
  async (req: Request, res: Response) => {
    try {
      const staffId = (req as any).user.staffId;
      const resignationData: ResignationRequest = req.body;
      const result = await hrService.submitResignation(req, staffId, resignationData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/resignation/:id/approve',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_RESIGNATION_APPROVE_ALL),
  async (req: Request, res: Response) => {
    try {
      const resignationId = BigInt(req.params.id);
      const result = await hrService.approveResignation(req, resignationId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.post(
  '/promotion/propose',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_CREATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const promotionData: PromotionRequest = req.body;
      const result = await hrService.proposePromotion(req, promotionData);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/promotion/:id/approve',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_PROMOTION_APPROVE_ALL),
  async (req: Request, res: Response) => {
    try {
      const promotionId = BigInt(req.params.id);
      const result = await hrService.approvePromotion(req, promotionId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/onboarding/:taskId/complete',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_ONBOARDING_COMPLETE_OWN),
  async (req: Request, res: Response) => {
    try {
      const onboardingTaskId = BigInt(req.params.taskId);
      const staffId = (req as any).user.staffId;
      const result = await hrService.completeOnboardingTask(req, onboardingTaskId, staffId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.get(
  '/records/:staffId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_RECORDS_READ_ALL),
  async (req: Request, res: Response) => {
    try {
      const staffId = BigInt(req.params.staffId);
      const result = await hrService.getEmployeeRecords(req, staffId);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

router.put(
  '/records/:staffId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission(PermissionCode.HR_RECORDS_UPDATE_ALL),
  async (req: Request, res: Response) => {
    try {
      const staffId = BigInt(req.params.staffId);
      const result = await hrService.updateEmployeeRecords(req, staffId, req.body);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: (error as Error).message });
    }
  }
);

export default router;
