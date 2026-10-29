"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const hits = new Map();
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits)
        if (v.reset < now)
            hits.delete(k);
}, 60000).unref();
function rateLimit(bucket, max, windowMs) {
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
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
//# sourceMappingURL=rateLimit.js.map