import { Request } from 'express';
import { BaseService } from './BaseService';
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
export declare class HRService extends BaseService {
    issueWarning(req: Request, warningData: WarningRequest): Promise<{
        message: string;
        escalationLevel: 1 | 2 | 3;
        status: string;
    }>;
    acknowledgeWarning(req: Request, warningId: bigint, staffId: bigint): Promise<{
        message: string;
    }>;
    submitResignation(req: Request, staffId: bigint, resignationData: ResignationRequest): Promise<{
        message: string;
        resignationDate: Date;
        lastWorkingDate: Date;
        status: string;
    }>;
    approveResignation(req: Request, resignationId: bigint): Promise<{
        message: string;
    }>;
    proposePromotion(req: Request, promotionData: PromotionRequest): Promise<{
        message: string;
        status: string;
        effectiveDate: Date;
    }>;
    approvePromotion(req: Request, promotionId: bigint): Promise<{
        message: string;
    }>;
    completeOnboardingTask(req: Request, onboardingTaskId: bigint, staffId: bigint, updateData: OnboardingTaskUpdateRequest): Promise<{
        message: string;
    }>;
    getEmployeeRecords(req: Request, staffId: bigint): Promise<{
        basicInfo: {};
        qualifications: never[];
        skills: never[];
        documents: never[];
        workHistory: never[];
        payrollInfo: {};
        benefitsInfo: {};
    }>;
    updateEmployeeRecords(req: Request, staffId: bigint, recordData: any): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=HRService.d.ts.map