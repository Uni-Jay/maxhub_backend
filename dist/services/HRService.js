"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HRService = void 0;
const BaseService_1 = require("./BaseService");
const PermissionCodes_1 = require("../config/PermissionCodes");
class HRService extends BaseService_1.BaseService {
    async issueWarning(req, warningData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_WARNING_CREATE_ALL);
        const { staffId, warningType, reason, description, followUpDate } = warningData;
        let escalationLevel = 1;
        if (warningType === 'Written')
            escalationLevel = 2;
        if (warningType === 'Final')
            escalationLevel = 3;
        return {
            message: 'Warning issued successfully',
            escalationLevel,
            status: 'Active',
        };
    }
    async acknowledgeWarning(req, warningId, staffId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_WARNING_READ_OWN);
        return { message: 'Warning acknowledged' };
    }
    async submitResignation(req, staffId, resignationData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_RESIGNATION_CREATE_OWN);
        const authenticatedUser = req.user;
        const requestingUserId = authenticatedUser.staffId;
        if (requestingUserId !== staffId) {
            throw new Error('Unauthorized: Can only submit resignation for yourself');
        }
        const lastWorkingDate = new Date();
        lastWorkingDate.setDate(lastWorkingDate.getDate() + resignationData.noticePeroidDays);
        return {
            message: 'Resignation submitted',
            resignationDate: new Date(),
            lastWorkingDate,
            status: 'Submitted',
        };
    }
    async approveResignation(req, resignationId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_RESIGNATION_APPROVE_ALL);
        return { message: 'Resignation approved' };
    }
    async proposePromotion(req, promotionData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_PROMOTION_CREATE_ALL);
        const { staffId, toDesignationId, toDepartmentId, reason, salaryIncreasePercentage, effectiveDate } = promotionData;
        return {
            message: 'Promotion proposed',
            status: 'Proposed',
            effectiveDate,
        };
    }
    async approvePromotion(req, promotionId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_PROMOTION_APPROVE_ALL);
        return { message: 'Promotion approved and scheduled' };
    }
    async completeOnboardingTask(req, onboardingTaskId, staffId, updateData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_ONBOARDING_COMPLETE_OWN);
        return { message: 'Onboarding task updated' };
    }
    async getEmployeeRecords(req, staffId) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_RECORDS_READ_ALL);
        return {
            basicInfo: {},
            qualifications: [],
            skills: [],
            documents: [],
            workHistory: [],
            payrollInfo: {},
            benefitsInfo: {},
        };
    }
    async updateEmployeeRecords(req, staffId, recordData) {
        await this.checkPermission(req, PermissionCodes_1.PermissionCode.HR_RECORDS_UPDATE_ALL);
        return { message: 'Employee records updated' };
    }
}
exports.HRService = HRService;
//# sourceMappingURL=HRService.js.map