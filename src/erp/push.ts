import webpush from 'web-push';
import { QueryTypes } from 'sequelize';
import sequelize from '@config/Database';

/**
 * Desktop / phone pop-up notifications (Web Push). Works even when MaxHub is
 * closed or in another tab; the service worker skips showing it when the
 * person is already looking at MaxHub (they get the in-app toast instead).
 *
 * VAPID keys come from VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY, or are generated
 * once and stored in erp_settings so they survive restarts.
 */

let ready: Promise<string | null> | null = null;

async function ensureTable() {
  await sequelize.query(`CREATE TABLE IF NOT EXISTS erp_push_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    "userId" BIGINT NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    keys JSONB NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await sequelize.query(`CREATE INDEX IF NOT EXISTS erp_push_user_idx ON erp_push_subscriptions ("userId")`);
}

export function initPush(): Promise<string | null> {
  if (ready) return ready;
  ready = (async () => {
    try {
      await ensureTable();
      let pub = process.env.VAPID_PUBLIC_KEY;
      let priv = process.env.VAPID_PRIVATE_KEY;
      if (!pub || !priv) {
        const rows: any[] = await sequelize.query(`SELECT value FROM erp_settings WHERE key = 'vapidKeys'`, { type: QueryTypes.SELECT });
        if (rows[0]?.value?.publicKey) {
          pub = rows[0].value.publicKey; priv = rows[0].value.privateKey;
        } else {
          const k = webpush.generateVAPIDKeys();
          pub = k.publicKey; priv = k.privateKey;
          await sequelize.query(
            `INSERT INTO erp_settings (key, value, "createdAt", "updatedAt") VALUES ('vapidKeys', :v::jsonb, NOW(), NOW()) ON CONFLICT (key) DO NOTHING`,
            { replacements: { v: JSON.stringify(k) } },
          );
          const again: any[] = await sequelize.query(`SELECT value FROM erp_settings WHERE key = 'vapidKeys'`, { type: QueryTypes.SELECT });
          pub = again[0].value.publicKey; priv = again[0].value.privateKey;
        }
      }
      webpush.setVapidDetails(`mailto:${process.env.INFO_FROM || 'info@maxhubng.company'}`, pub!, priv!);
      return pub!;
    } catch (e: any) {
      console.error('[push] init failed:', e.message);
      ready = null;
      return null;
    }
  })();
  return ready;
}

export async function saveSubscription(userId: number, sub: any, userAgent?: string) {
  await initPush();
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) throw new Error('Invalid subscription');
  await sequelize.query(
    `INSERT INTO erp_push_subscriptions ("userId", endpoint, keys, "userAgent") VALUES (:u, :e, :k::jsonb, :ua)
     ON CONFLICT (endpoint) DO UPDATE SET "userId" = EXCLUDED."userId", keys = EXCLUDED.keys`,
    { replacements: { u: userId, e: sub.endpoint, k: JSON.stringify(sub.keys), ua: (userAgent || '').slice(0, 300) } },
  );
}

export async function removeSubscription(endpoint: string) {
  await sequelize.query(`DELETE FROM erp_push_subscriptions WHERE endpoint = :e`, { replacements: { e: endpoint } });
}

export interface PushPayload { title: string; body: string; url?: string; tag?: string; icon?: string }

/** Fire-and-forget: never throws, removes dead subscriptions. */
export async function pushToUsers(userIds: number[], payload: PushPayload): Promise<void> {
  try {
    const ids = [...new Set(userIds.filter(Boolean).map(Number))];
    if (!ids.length || !(await initPush())) return;
    const subs: any[] = await sequelize.query(
      `SELECT endpoint, keys FROM erp_push_subscriptions WHERE "userId" IN (:ids)`,
      { replacements: { ids }, type: QueryTypes.SELECT },
    );
    const body = JSON.stringify({ icon: '/images/maxhublogo.jpeg', ...payload, body: (payload.body || '').slice(0, 300) });
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, body, { TTL: 60 * 60 * 24 });
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await removeSubscription(s.endpoint);
      }
    }));
  } catch { /* never break the caller */ }
}
