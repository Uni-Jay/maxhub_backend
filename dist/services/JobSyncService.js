"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const JobPosting_model_1 = require("../models/JobPosting.model");
const JobSyncLog_model_1 = require("../models/JobSyncLog.model");
const BUSINESS_UNIT_CONFIG = {
    KS: { name: 'Kurios SAT', baseUrl: 'https://www.kurios-sat.tech', apiKeyEnv: 'JOB_SYNC_KS_API_KEY' },
    VM: { name: 'VisaMax Travels', baseUrl: 'https://www.visamaxtravels.net', apiKeyEnv: 'JOB_SYNC_VM_API_KEY' },
    BM: { name: 'BeadMax', baseUrl: 'https://www.beadmax.net', apiKeyEnv: 'JOB_SYNC_BM_API_KEY' },
};
const MAX_AUTO_RETRY_ATTEMPTS = 10;
const REQUEST_TIMEOUT_MS = 15000;
function buildPayload(posting) {
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
    async pushToPortal(config, method, path, payload) {
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
        }
        catch (err) {
            return { ok: false, error: err?.message || 'Network error' };
        }
    }
    async applyResult(posting, action, result, externalId) {
        const attemptNumber = posting.syncAttempts + 1;
        const errorMessage = result.ok ? undefined : (result.error || result.body?.slice(0, 1000) || `HTTP ${result.status}`);
        await JobSyncLog_model_1.JobSyncLog.create({
            jobPostingId: posting.id,
            businessUnit: posting.businessUnit,
            action,
            status: result.ok ? 'Success' : 'Failed',
            httpStatusCode: result.status,
            errorMessage,
            attemptNumber,
        });
        const updates = {
            syncAttempts: attemptNumber,
            syncStatus: result.ok ? 'Synced' : 'Failed',
            lastSyncError: errorMessage ?? null,
        };
        if (result.ok)
            updates.lastSyncedAt = new Date();
        if (result.ok && action === 'Create' && externalId)
            updates.externalJobId = externalId;
        if (result.ok && action === 'Delete')
            updates.externalJobId = null;
        await posting.update(updates);
    }
    async syncCreate(posting) {
        if (!posting.businessUnit)
            return;
        const config = BUSINESS_UNIT_CONFIG[posting.businessUnit];
        const result = await this.pushToPortal(config, 'POST', '/api/jobs', buildPayload(posting));
        let externalId;
        if (result.ok && result.body) {
            try {
                externalId = JSON.parse(result.body)?.id?.toString();
            }
            catch { }
        }
        await this.applyResult(posting, 'Create', result, externalId);
    }
    async syncUpdate(posting) {
        if (!posting.businessUnit || !posting.externalJobId)
            return;
        const config = BUSINESS_UNIT_CONFIG[posting.businessUnit];
        const result = await this.pushToPortal(config, 'PUT', `/api/jobs/${posting.externalJobId}`, buildPayload(posting));
        await this.applyResult(posting, 'Update', result);
    }
    async syncDelete(posting) {
        if (!posting.businessUnit || !posting.externalJobId)
            return;
        const config = BUSINESS_UNIT_CONFIG[posting.businessUnit];
        const result = await this.pushToPortal(config, 'DELETE', `/api/jobs/${posting.externalJobId}`);
        await this.applyResult(posting, 'Delete', result);
    }
    async retryOne(jobPostingId) {
        const posting = await JobPosting_model_1.JobPosting.findByPk(jobPostingId);
        if (!posting || !posting.businessUnit)
            return;
        if (posting.externalJobId)
            await this.syncUpdate(posting);
        else
            await this.syncCreate(posting);
    }
    async retryPendingAndFailed() {
        const postings = await JobPosting_model_1.JobPosting.findAll({
            where: {
                businessUnit: { [sequelize_1.Op.ne]: null },
                syncStatus: { [sequelize_1.Op.in]: ['Pending', 'Failed'] },
                syncAttempts: { [sequelize_1.Op.lt]: MAX_AUTO_RETRY_ATTEMPTS },
            },
        });
        for (const posting of postings) {
            if (posting.externalJobId)
                await this.syncUpdate(posting);
            else
                await this.syncCreate(posting);
        }
        return { attempted: postings.length };
    }
}
exports.default = new JobSyncService();
//# sourceMappingURL=JobSyncService.js.map