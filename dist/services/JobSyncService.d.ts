import { JobPosting } from '../models/JobPosting.model';
declare class JobSyncService {
    private pushToPortal;
    private applyResult;
    syncCreate(posting: JobPosting): Promise<void>;
    syncUpdate(posting: JobPosting): Promise<void>;
    syncDelete(posting: JobPosting): Promise<void>;
    retryOne(jobPostingId: bigint | number | string): Promise<void>;
    retryPendingAndFailed(): Promise<{
        attempted: number;
    }>;
}
declare const _default: JobSyncService;
export default _default;
//# sourceMappingURL=JobSyncService.d.ts.map