"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRateLimit = aiRateLimit;
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const store = new Map();
const LIMITS = {
    chat: { max: 30, windowMs: 60 * 60 * 1000 },
    report: { max: 10, windowMs: 60 * 60 * 1000 },
    summarize: { max: 10, windowMs: 60 * 60 * 1000 },
    email: { max: 20, windowMs: 60 * 60 * 1000 },
    tasks: { max: 15, windowMs: 60 * 60 * 1000 },
    reminder: { max: 20, windowMs: 60 * 60 * 1000 },
    default: { max: 20, windowMs: 60 * 60 * 1000 },
};
function getKey(userId, feature) {
    return { userKey: String(userId), featureKey: feature };
}
function aiRateLimit(feature) {
    return (req, res, next) => {
        const user = req.user;
        if (user?.roles?.includes('superadmin')) {
            return next();
        }
        const userId = user?.id ?? req.ip ?? 'anonymous';
        const { userKey, featureKey } = getKey(userId, feature);
        const limit = LIMITS[feature] ?? LIMITS.default;
        const now = Date.now();
        if (!store.has(userKey))
            store.set(userKey, new Map());
        const userStore = store.get(userKey);
        const entry = userStore.get(featureKey);
        if (!entry || now > entry.resetAt) {
            userStore.set(featureKey, { count: 1, resetAt: now + limit.windowMs });
            return next();
        }
        if (entry.count >= limit.max) {
            const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
            res.setHeader('Retry-After', String(retryAfterSec));
            res.setHeader('X-RateLimit-Limit', String(limit.max));
            res.setHeader('X-RateLimit-Remaining', '0');
            ResponseFormatter_1.ResponseFormatter.error(res, `AI rate limit exceeded. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`, 429);
            return;
        }
        entry.count++;
        res.setHeader('X-RateLimit-Limit', String(limit.max));
        res.setHeader('X-RateLimit-Remaining', String(limit.max - entry.count));
        next();
    };
}
//# sourceMappingURL=AIRateLimiter.js.map