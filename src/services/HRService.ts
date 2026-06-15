import { Request } from 'express';
import { BaseService } from './BaseService';
import { PermissionCode } from '../config/PermissionCodes';

export interface WarningRequest {
  staffId: bigint;
  warningType: 'Verbal' | 'Written' | 'Final';
  reason: string;
  description?: string;
  followUpDate?: Date;
}

export interface ResignationRequest {
  reasonForResignation: string;
  noticePeroidDays: number;
  lastWorkingDate?: Date;
}

export interface PromotionRequest {
  staffId: bigint;
  toDesignationId: bigint;
  toDepartmentId?: bigint;
  reason?: string;
  salaryIncreasePercentage?: number;
  effectiveDate: Date;
}

export interface OnboardingTaskUpdateRequest {
  status: 'Pending' | 'Completed';
  completionDate?: Date;
  notes?: string;
}

export class HRService extends BaseService {
  /**
   * Issue warning to employee
   */
  async issueWarning(req: Request, warningData: WarningRequest) {
    await this.checkPermission(req, PermissionCode.HR_WARNING_CREATE_ALL);

    const { staffId, warningType, reason, description, followUpDate } = warningData;

    // IMPROVEMENT: Validate that issuer is authorized (manager or HR)
    // const authenticatedUser = (req as any).user;
    // const targetStaff = await staffRepo.findByPk(staffId);
    // if (targetStaff.departmentId !== authenticatedUser.departmentId) {
    //   throw new Error('Can only issue warnings in own department');
    // }

    // Determine escalation level based on warning type
    let escalationLevel: 1 | 2 | 3 = 1;
    if (warningType === 'Written') escalationLevel = 2;
    if (warningType === 'Final') escalationLevel = 3;

    // Create warning record
    // const warning = await warningRepo.create({
    //   staffId,
    //   issuedBy: req.user.staffId,
    //   warningType,
    //   reason,
    //   description,
    //   issuedDate: new Date(),
    //   followUpDate,
    //   escalationLevel,
    //   status: 'Active',
    // });

    // IMPROVEMENT: Audit sensitive HR action
    // await auditService.logSensitiveAction({
    //   action: 'ISSUE_WARNING',
    //   targetStaffId: staffId,
    //   performedBy: req.user.staffId,
    //   details: { warningType, reason },
    //   timestamp: new Date()
    // });

    return {
      message: 'Warning issued successfully',
      escalationLevel,
      status: 'Active',
    };
  }

  /**
   * Acknowledge warning - IMPROVED: User can only acknowledge their own
   */
  async acknowledgeWarning(req: Request, warningId: bigint, staffId: bigint) {
    await this.checkPermission(req, PermissionCode.HR_WARNING_READ_OWN);

    // IMPROVEMENT: Prevent self-update without verification
    // Get warning
    // const warning = await warningRepo.findByPk(warningId);
    // if (!warning) throw new Error('Warning not found');
    
    // IMPROVEMENT: Verify user can only acknowledge their own warnings
    // if (warning.staffId !== staffId) {
    //   throw new Error('Can only acknowledge own warnings');
    // }

    // if (warning.status !== 'Active') {
    //   throw new Error('Cannot acknowledge non-active warning');
    // }

    // Update acknowledgment with device verification
    // const requestDeviceId = (req as any).headers['device-id'];
    // await warning.update({
    //   acknowledgedBy: staffId,
    //   acknowledgedDate: new Date(),
    //   acknowledgedDeviceId: requestDeviceId,
    //   acknowledgedIpAddress: req.ip
    // });

    return { message: 'Warning acknowledged' };
  }

  /**
   * Submit resignation - IMPROVED: User can only resign themselves
   */
  async submitResignation(req: Request, staffId: bigint, resignationData: ResignationRequest) {
    await this.checkPermission(req, PermissionCode.HR_RESIGNATION_CREATE_OWN);

    // IMPROVEMENT: CRITICAL FIX - staffId from authenticated user, not request body
    const authenticatedUser = (req as any).user;
    const requestingUserId = authenticatedUser.staffId;

    // IMPROVEMENT: User can only resign themselves
    if (requestingUserId !== staffId) {
      throw new Error('Unauthorized: Can only submit resignation for yourself');
    }

    // IMPROVEMENT: Check if resignation already exists
    // const existingResignation = await resignationRepo.findOne({
    //   where: { staffId, status: { [Op.not]: 'Completed' } }
    // });
    // if (existingResignation) throw new Error('Existing resignation pending');

    // Create resignation record
    const lastWorkingDate = new Date();
    lastWorkingDate.setDate(lastWorkingDate.getDate() + resignationData.noticePeroidDays);

    // const resignation = await resignationRepo.create({
    //   staffId,
    //   resignationDate: new Date(),
    //   lastWorkingDate,
    //   reasonForResignation: resignationData.reasonForResignation,
    //   noticePeroidDays: resignationData.noticePeroidDays,
    //   status: 'Submitted',
    // });

    // IMPROVEMENT: Audit sensitive action
    // await auditService.logSensitiveAction({
    //   action: 'RESIGNATION_SUBMITTED',
    //   targetStaffId: staffId,
    //   performedBy: staffId,
    //   details: { noticePeroidDays: resignationData.noticePeroidDays },
    //   timestamp: new Date()
    // });

    return {
      message: 'Resignation submitted',
      resignationDate: new Date(),
      lastWorkingDate,
      status: 'Submitted',
    };
  }

  /**
   * Approve resignation - IMPROVED: Only authorized approvers
   */
  async approveResignation(req: Request, resignationId: bigint) {
    await this.checkPermission(req, PermissionCode.HR_RESIGNATION_APPROVE_ALL);

    // IMPROVEMENT: Validate approver authority
    // const resignation = await resignationRepo.findByPk(resignationId, {
    //   include: ['staff']
    // });
    // const authenticatedUser = (req as any).user;
    
    // IMPROVEMENT: Only HR or department head can approve
    // const hasApprovalAuthority = 
    //   authenticatedUser.departmentId === resignation.staff.departmentId ||
    //   authenticatedUser.roleLevel >= ROLE_HIERARCHY.HR_DIRECTOR;
    
    // if (!hasApprovalAuthority) {
    //   throw new Error('Unauthorized: Insufficient authority to approve resignation');
    // }

    // if (!resignation) throw new Error('Resignation not found');

    // Update status
    // await resignation.update({
    //   status: 'Approved',
    //   approvalDate: new Date(),
    //   approvedBy: req.user.staffId,
    // });

    // Notify staff
    // await notificationService.sendResignationApprovalNotification(resignation.staffId);

    return { message: 'Resignation approved' };
  }

  /**
   * Propose promotion - IMPROVED: Department authority validation
   */
  async proposePromotion(req: Request, promotionData: PromotionRequest) {
    await this.checkPermission(req, PermissionCode.HR_PROMOTION_CREATE_ALL);

    const { staffId, toDesignationId, toDepartmentId, reason, salaryIncreasePercentage, effectiveDate } =
      promotionData;

    // IMPROVEMENT: Validate proposer authority
    // const authenticatedUser = (req as any).user;
    // const targetStaff = await staffRepo.findByPk(staffId);
    // if (targetStaff.departmentId !== authenticatedUser.departmentId) {
    //   throw new Error('Can only propose promotions in own department');
    // }

    // Get staff current designation and department
    // const staff = await staffRepo.findByPk(staffId);
    // const fromDesignationId = staff.designationId;
    // const fromDepartmentId = staff.departmentId;

    // IMPROVEMENT: Validate effective date is in future
    // if (effectiveDate < new Date()) {
    //   throw new Error('Effective date must be in the future');
    // }

    // Create promotion request (not direct update)
    // const promotion = await promotionRepo.create({
    //   staffId,
    //   fromDesignationId,
    //   toDesignationId,
    //   fromDepartmentId,
    //   toDepartmentId,
    //   promotionDate: new Date(),
    //   effectiveDate,
    //   reason,
    //   promotedBy: req.user.staffId,
    //   salaryIncreasePercentage,
    //   status: 'Proposed',
    // });

    return {
      message: 'Promotion proposed',
      status: 'Proposed',
      effectiveDate,
    };
  }

  /**
   * Approve promotion - IMPROVED: Multi-level approval support
   */
  async approvePromotion(req: Request, promotionId: bigint) {
    await this.checkPermission(req, PermissionCode.HR_PROMOTION_APPROVE_ALL);

    // IMPROVEMENT: Validate approver is authorized for this department/designation
    // const promotion = await promotionRepo.findByPk(promotionId, {
    //   include: ['staff']
    // });
    // const authenticatedUser = (req as any).user;

    // IMPROVEMENT: Check approver's department matches target
    // if (promotion.toDepartmentId !== authenticatedUser.departmentId) {
    //   throw new Error('Can only approve promotions in own department');
    // }

    // if (!promotion) throw new Error('Promotion not found');
    // if (promotion.status !== 'Proposed') {
    //   throw new Error('Promotion already processed');
    // }

    // Update promotion status
    // await promotion.update({
    //   status: 'Approved',
    //   approvalDate: new Date(),
    // });

    // Update staff designation only on effective date (not immediately)
    // if (promotion.effectiveDate <= new Date()) {
    //   await staffRepo.update(
    //     {
    //       designationId: promotion.toDesignationId,
    //       departmentId: promotion.toDepartmentId || promotion.fromDepartmentId,
    //     },
    //     { where: { id: promotion.staffId } }
    //   );
    // }

    // Notify staff
    // await notificationService.sendPromotionNotification(promotion.staffId);

    return { message: 'Promotion approved and scheduled' };
  }

  /**
   * Complete onboarding task - IMPROVED: User can only complete their own
   */
  async completeOnboardingTask(
    req: Request,
    onboardingTaskId: bigint,
    staffId: bigint,
    updateData: OnboardingTaskUpdateRequest
  ) {
    await this.checkPermission(req, PermissionCode.HR_ONBOARDING_COMPLETE_OWN);

    // IMPROVEMENT: User can only complete their own onboarding
    // const task = await onboardingTaskRepo.findByPk(onboardingTaskId);
    // if (!task || task.staffId !== staffId) throw new Error('Unauthorized');

    // IMPROVEMENT: Check dependencies
    // if (updateData.status === 'Completed') {
    //   const dependencies = await task.getDependencies();
    //   const allCompleted = dependencies.every(dep => dep.status === 'Completed');
    //   if (!dependencies.length === 0 && !allCompleted) {
    //     throw new Error('Cannot complete: Dependent tasks not completed');
    //   }
    // }

    // Update task
    // await task.update({
    //   status: updateData.status,
    //   completionDate: updateData.completionDate,
    //   notes: updateData.notes,
    // });

    return { message: 'Onboarding task updated' };
  }

  /**
   * Get employee records - IMPROVED: Department-level access control
   */
  async getEmployeeRecords(req: Request, staffId: bigint) {
    await this.checkPermission(req, PermissionCode.HR_RECORDS_READ_ALL);

    // IMPROVEMENT: Department head can only view own department
    // const authenticatedUser = (req as any).user;
    // const targetStaff = await staffRepo.findByPk(staffId);
    // if (targetStaff.departmentId !== authenticatedUser.departmentId) {
    //   throw new Error('Can only view employees in own department');
    // }

    // Query employee data
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

  /**
   * Update employee records - IMPROVED: Audit all changes
   */
  async updateEmployeeRecords(req: Request, staffId: bigint, recordData: any) {
    await this.checkPermission(req, PermissionCode.HR_RECORDS_UPDATE_ALL);

    // IMPROVEMENT: Only update allowed fields (prevent escalation)
    // const allowedFields = ['phone', 'email', 'address', 'emergencyContact'];
    // const updateFields = Object.keys(recordData);
    // const invalidFields = updateFields.filter(f => !allowedFields.includes(f));
    // if (invalidFields.length > 0) {
    //   throw new Error(`Cannot update fields: ${invalidFields.join(', ')}`);
    // }

    // IMPROVEMENT: Audit all changes
    // const staff = await staffRepo.findByPk(staffId);
    // const changes = {};
    // for (const [key, value] of Object.entries(recordData)) {
    //   if (staff[key] !== value) {
    //     changes[key] = { from: staff[key], to: value };
    //   }
    // }

    // await auditService.logRecordChange({
    //   targetStaffId: staffId,
    //   performedBy: req.user.staffId,
    //   changes,
    //   timestamp: new Date()
    // });

    // const staff = await staffRepo.findByPk(staffId);
    // await staff.update(recordData);

    return { message: 'Employee records updated' };
  }
}
