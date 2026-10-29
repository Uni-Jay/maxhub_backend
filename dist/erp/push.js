"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPush = initPush;
exports.saveSubscription = saveSubscription;
exports.removeSubscription = removeSubscription;
exports.pushToUsers = pushToUsers;
const web_push_1 = __importDefault(require("web-push"));
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
let ready = null;
async function ensureTable() {
    await Database_1.default.query(`CREATE TABLE IF NOT EXISTS erp_push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
    await Database_1.default.query(`CREATE INDEX IF NOT EXISTS erp_push_user_idx ON erp_push_subscriptions ("userId")`);
}
function initPush() {
    if (ready)
        return ready;
    ready = (async () => {
        try {
            await ensureTable();
            let pub = process.env.VAPID_PUBLIC_KEY;
            let priv = process.env.VAPID_PRIVATE_KEY;
            if (!pub || !priv) {
                const rows = await Database_1.default.query(`SELECT value FROM erp_settings WHERE key = 'vapidKeys'`, { type: sequelize_1.QueryTypes.SELECT });
                if (rows[0]?.value?.publicKey) {
                    pub = rows[0].value.publicKey;
                    priv = rows[0].value.privateKey;
                }
                else {
                    const k = web_push_1.default.generateVAPIDKeys();
                    pub = k.publicKey;
                    priv = k.privateKey;
                    await Database_1.default.query(`INSERT INTO erp_settings (key, value, "createdAt", "updatedAt") VALUES ('vapidKeys', :v::jsonb, NOW(), NOW()) ON CONFLICT (key) DO NOTHING`, { replacements: { v: JSON.stringify(k) } });
                    const again = await Database_1.default.query(`SELECT value FROM erp_settings WHERE key = 'vapidKeys'`, { type: sequelize_1.QueryTypes.SELECT });
                    pub = again[0].value.publicKey;
                    priv = again[0].value.privateKey;
                }
            }
            web_push_1.default.setVapidDetails(`mailto:${process.env.INFO_FROM || 'info@maxhubng.company'}`, pub, priv);
            return pub;
        }
        catch (e) {
            console.error('[push] init failed:', e.message);
            ready = null;
            return null;
        }
    })();
    return ready;
}
async function saveSubscription(userId, sub, userAgent) {
    await initPush();
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth)
        throw new Error('Invalid subscription');
    await Database_1.default.query(`INSERT INTO erp_push_subscriptions ("userId", endpoint, keys, "userAgent") VALUES (:u, :e, :k::jsonb, :ua)
     ON CONFLICT (endpoint) DO UPDATE SET "userId" = EXCLUDED."userId", keys = EXCLUDED.keys`, { replacements: { u: userId, e: sub.endpoint, k: JSON.stringify(sub.keys), ua: (userAgent || '').slice(0, 300) } });
}
async function removeSubscription(endpoint) {
    await Database_1.default.query(`DELETE FROM erp_push_subscriptions WHERE endpoint = :e`, { replacements: { e: endpoint } });
}
async function pushToUsers(userIds, payload) {
    try {
        const ids = [...new Set(userIds.filter(Boolean).map(Number))];
        if (!ids.length || !(await initPush()))
            return;
        const subs = await Database_1.default.query(`SELECT endpoint, keys FROM erp_push_subscriptions WHERE "userId" IN (:ids)`, { replacements: { ids }, type: sequelize_1.QueryTypes.SELECT });
        const body = JSON.stringify({ icon: '/images/maxhublogo.jpeg', ...payload, body: (payload.body || '').slice(0, 300) });
        await Promise.all(subs.map(async (s) => {
            try {
                await web_push_1.default.sendNotification({ endpoint: s.endpoint, keys: s.keys }, body, { TTL: 60 * 60 * 24 });
            }
            catch (e) {
                if (e?.statusCode === 404 || e?.statusCode === 410)
                    await removeSubscription(s.endpoint);
            }
        }));
    }
    catch { }
}
//# sourceMappingURL=push.js.map