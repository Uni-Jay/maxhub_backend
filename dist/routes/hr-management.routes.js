"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const RBACMiddleware_1 = require("../middleware/RBACMiddleware");
const PermissionCodes_1 = require("../config/PermissionCodes");
const HRService_1 = require("../services/HRService");
const router = (0, express_1.Router)();
const hrService = new HRService_1.HRService();
const auth = new AuthMiddleware_1.AuthMiddleware();
const rbac = new RBACMiddleware_1.RBACMiddleware();
router.post('/warnings/issue', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_WARNING_CREATE_ALL), async (req, res) => {
    try {
        const warningData = req.body;
        const result = await hrService.issueWarning(req, warningData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/warnings/:id/acknowledge', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_WARNING_READ_OWN), async (req, res) => {
    try {
        const warningId = BigInt(req.params.id);
        const staffId = req.user.staffId;
        const result = await hrService.acknowledgeWarning(req, warningId, staffId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/resignation/submit', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_RESIGNATION_CREATE_OWN), async (req, res) => {
    try {
        const staffId = req.user.staffId;
        const resignationData = req.body;
        const result = await hrService.submitResignation(req, staffId, resignationData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/resignation/:id/approve', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_RESIGNATION_APPROVE_ALL), async (req, res) => {
    try {
        const resignationId = BigInt(req.params.id);
        const result = await hrService.approveResignation(req, resignationId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.post('/promotion/propose', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_CREATE_ALL), async (req, res) => {
    try {
        const promotionData = req.body;
        const result = await hrService.proposePromotion(req, promotionData);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/promotion/:id/approve', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_PROMOTION_APPROVE_ALL), async (req, res) => {
    try {
        const promotionId = BigInt(req.params.id);
        const result = await hrService.approvePromotion(req, promotionId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/onboarding/:taskId/complete', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_ONBOARDING_COMPLETE_OWN), async (req, res) => {
    try {
        const onboardingTaskId = BigInt(req.params.taskId);
        const staffId = req.user.staffId;
        const result = await hrService.completeOnboardingTask(req, onboardingTaskId, staffId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.get('/records/:staffId', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_RECORDS_READ_ALL), async (req, res) => {
    try {
        const staffId = BigInt(req.params.staffId);
        const result = await hrService.getEmployeeRecords(req, staffId);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
router.put('/records/:staffId', auth.authenticate(), rbac.requirePermission(PermissionCodes_1.PermissionCode.HR_RECORDS_UPDATE_ALL), async (req, res) => {
    try {
        const staffId = BigInt(req.params.staffId);
        const result = await hrService.updateEmployeeRecords(req, staffId, req.body);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=hr-management.routes.js.map