import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '@utils/ResponseFormatter';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: userId → feature → entry
const store = new Map<string, Map<string, RateLimitEntry>>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  chat: { max: 30, windowMs: 60 * 60 * 1000 },       // 30 per hour
  report: { max: 10, windowMs: 60 * 60 * 1000 },      // 10 per hour
  summarize: { max: 10, windowMs: 60 * 60 * 1000 },   // 10 per hour
  email: { max: 20, windowMs: 60 * 60 * 1000 },       // 20 per hour
  tasks: { max: 15, windowMs: 60 * 60 * 1000 },       // 15 per hour
  reminder: { max: 20, windowMs: 60 * 60 * 1000 },    // 20 per hour
  default: { max: 20, windowMs: 60 * 60 * 1000 },
};

function getKey(userId: string | number, feature: string): { userKey: string; featureKey: string } {
  return { userKey: String(userId), featureKey: feature };
}

export function aiRateLimit(feature: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;

    // Superadmin bypasses rate limits
    if (user?.roles?.includes('superadmin')) {
      return next();
    }

    const userId = user?.id ?? req.ip ?? 'anonymous';
    const { userKey, featureKey } = getKey(userId, feature);
    const limit = LIMITS[feature] ?? LIMITS.default;
    const now = Date.now();

    if (!store.has(userKey)) store.set(userKey, new Map());
    const userStore = store.get(userKey)!;

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
      ResponseFormatter.error(
        res,
        `AI rate limit exceeded. Try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`,
        429,
      );
      return;
    }

    entry.count++;
    res.setHeader('X-RateLimit-Limit', String(limit.max));
    res.setHeader('X-RateLimit-Remaining', String(limit.max - entry.count));
    next();
  };
}
