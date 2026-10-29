import { Request, Response, NextFunction } from 'express';

/**
 * Small in-memory fixed-window rate limiter (single instance on Render, so
 * memory is enough). Keyed by IP + bucket name.
 */
const hits = new Map<string, { n: number; reset: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
}, 60_000).unref();

export function rateLimit(bucket: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const key = `${bucket}:${ip}`;
    const now = Date.now();
    const cur = hits.get(key);
    if (!cur || cur.reset < now) {
      hits.set(key, { n: 1, reset: now + windowMs });
      return next();
    }
    cur.n++;
    if (cur.n > max) {
      res.setHeader('Retry-After', Math.ceil((cur.reset - now) / 1000));
      return res.status(429).json({ success: false, message: 'Too many requests. Please wait a moment and try again.' });
    }
    next();
  };
}
