import { Op } from 'sequelize';
import { JobPosting } from '../models/JobPosting.model';
import { JobSyncLog } from '../models/JobSyncLog.model';

type BusinessUnitCode = 'KS' | 'VM' | 'BM';

interface BusinessUnitConfig {
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
}

/**
 * PLACEHOLDER CONTRACT. The three destination sites don't have a confirmed
 * receiving API yet. This assumes a generic REST shape:
 *   POST   {baseUrl}/api/jobs          create  -> { id: string }
 *   PUT    {baseUrl}/api/jobs/:id      update
 *   DELETE {baseUrl}/api/jobs/:id      delete
 *   Authorization: Bearer <JOB_SYNC_*_API_KEY>
 * Everything outbound is isolated in pushToPortal() below — once the real
 * contract is confirmed per site, that's the only place that needs to change.
 */
const BUSINESS_UNIT_CONFIG: Record<BusinessUnitCode, BusinessUnitConfig> = {
  KS: { name: 'Kurios SAT', baseUrl: 'https://www.kurios-sat.tech', apiKeyEnv: 'JOB_SYNC_KS_API_KEY' },
  VM: { name: 'VisaMax Travels', baseUrl: 'https://www.visamaxtravels.net', apiKeyEnv: 'JOB_SYNC_VM_API_KEY' },
  BM: { name: 'BeadMax', baseUrl: 'https://www.beadmax.net', apiKeyEnv: 'JOB_SYNC_BM_API_KEY' },
};

const MAX_AUTO_RETRY_ATTEMPTS = 10;
const REQUEST_TIMEOUT_MS = 15000;

type SyncAction = 'Create' | 'Update' | 'Delete';

interface PushResult {
  ok: boolean;
  status?: number;
  body?: string;
  error?: string;
}

function buildPayload(posting: JobPosting): Record<string, unknown> {
  return {
    externalRef: posting.jobCode,
    title: posting.title,
    description: posting.description,
    jobType: posting.jobType,
    noOfPositions: posting.noOfPositions,
    location: posting.location,
    salaryMin: posting.salaryMin,
    salaryMax: posting.salaryMax,
    currency: posting.currency,
    requiredExperience: posting.requiredExperience,
    qualifications: posting.qualifications,
    skills: posting.skills,
    benefits: posting.benefits,
    postedDate: posting.postedDate,
    closingDate: posting.closingDate,
    status: posting.status,
  };
}

class JobSyncService {
  private async pushToPortal(
    config: BusinessUnitConfig,
    method: 'POST' | 'PUT' | 'DELETE',
    path: string,
    payload?: Record<string, unknown>
  ): Promise<PushResult> {
    const apiKey = process.env[config.apiKeyEnv];
    try {
      const res = await fetch(`${config.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      const body = await res.text().catch(() => '');
      return { ok: res.ok, status: res.status, body };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Network error' };
    }
  }

  private async applyResult(posting: JobPosting, action: SyncAction, result: PushResult, externalId?: string): Promise<void> {
    const attemptNumber = posting.syncAttempts + 1;
    const errorMessage = result.ok ? undefined : (result.error || result.body?.slice(0, 1000) || `HTTP ${result.status}`);

    await JobSyncLog.create({
      jobPostingId: posting.id,
      businessUnit: posting.businessUnit!,
      action,
      status: result.ok ? 'Success' : 'Failed',
      httpStatusCode: result.status,
      errorMessage,
      attemptNumber,
    } as any);

    const updates: Record<string, unknown> = {
      syncAttempts: attemptNumber,
      syncStatus: result.ok ? 'Synced' : 'Failed',
      lastSyncError: errorMessage ?? null,
    };
    if (result.ok) updates.lastSyncedAt = new Date();
    if (result.ok && action === 'Create' && externalId) updates.externalJobId = externalId;
    if (result.ok && action === 'Delete') updates.externalJobId = null;

    await posting.update(updates as any);
  }

  async syncCreate(posting: JobPosting): Promise<void> {
    if (!posting.businessUnit) return;
    const config = BUSINESS_UNIT_CONFIG[posting.businessUnit];
    const result = await this.pushToPortal(config, 'POST', '/api/jobs', buildPayload(posting));
    let externalId: string | undefined;
    if (result.ok && result.body) {
      try { externalId = JSON.parse(result.body)?.id?.toString(); } catch { /* non-JSON response from placeholder endpoint */ }
    }
    await this.applyResult(posting, 'Create', result, externalId);
  }

  async syncUpdate(posting: JobPosting): Promise<void> {
    if (!posting.businessUnit || !posting.externalJobId) return;
    const config = BUSINESS_UNIT_CONFIG[posting.businessUnit];
    const result = await this.pushToPortal(config, 'PUT', `/api/jobs/${posting.externalJobId}`, buildPayload(posting));
    await this.applyResult(posting, 'Update', result);
  }

  async syncDelete(posting: JobPosting): Promise<void> {
    if (!posting.businessUnit || !posting.externalJobId) return;
    const config = BUSINESS_UNIT_CONFIG[posting.businessUnit];
    const result = await this.pushToPortal(config, 'DELETE', `/api/jobs/${posting.externalJobId}`);
    await this.applyResult(posting, 'Delete', result);
  }

  /** Manual retry triggered from the sync dashboard — always attempts, ignoring the auto-retry attempt cap. */
  async retryOne(jobPostingId: bigint | number | string): Promise<void> {
    const posting = await JobPosting.findByPk(jobPostingId as any);
    if (!posting || !posting.businessUnit) return;
    if (posting.externalJobId) await this.syncUpdate(posting);
    else await this.syncCreate(posting);
  }

  /** Cron-driven sweep of postings still pending/failed sync, capped at MAX_AUTO_RETRY_ATTEMPTS. */
  async retryPendingAndFailed(): Promise<{ attempted: number }> {
    const postings = await JobPosting.findAll({
      where: {
        businessUnit: { [Op.ne]: null },
        syncStatus: { [Op.in]: ['Pending', 'Failed'] },
        syncAttempts: { [Op.lt]: MAX_AUTO_RETRY_ATTEMPTS },
      } as any,
    });
    for (const posting of postings) {
      if (posting.externalJobId) await this.syncUpdate(posting);
      else await this.syncCreate(posting);
    }
    return { attempted: postings.length };
  }
}

export default new JobSyncService();
