import { QueryTypes } from 'sequelize';
import sequelize from '@config/Database';
import { getOrCreateTransporter, resolveMailboxCredentials, sendViaTransporter } from '../services/email/email.service';

/**
 * Outbound customer messaging for the brands.
 *
 * Email: sent from the brand's own mailbox when BRAND_<CODE>_SMTP_USER/PASS
 * are set (e.g. BRAND_VM_SMTP_USER=info@visamaxtravels.com), otherwise from
 * the shared notification mailbox with the brand email as Reply-To, so
 * customer replies still reach the brand.
 *
 * WhatsApp: sent through the WhatsApp Business Cloud API when
 * WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are set. Without them we return a
 * click-to-chat link (wa.me) that opens WhatsApp on the staff member's
 * device with the message pre-filled — nothing is silently "sent".
 */

export interface BrandInfo {
  code: string; displayName: string; email?: string; phone?: string; whatsapp?: string;
  website?: string; address?: string; logoUrl?: string; primaryColor?: string; tagline?: string;
}

export async function brandForDepartment(departmentId?: number | null): Promise<BrandInfo> {
  const fallback: BrandInfo = { code: 'MAXHUB', displayName: process.env.COMPANY_NAME || 'MaxHub', email: process.env.INFO_FROM, primaryColor: '#4f46e5' };
  if (!departmentId) return fallback;
  const rows: any[] = await sequelize.query(
    `SELECT bp.* FROM erp_brand_profiles bp
     WHERE bp."departmentId" = :d
        OR bp."departmentId" = (SELECT "parentDepartmentId" FROM departments WHERE id = :d)
     ORDER BY (bp."departmentId" = :d) DESC LIMIT 1`,
    { replacements: { d: departmentId }, type: QueryTypes.SELECT },
  );
  return rows[0] || fallback;
}

export function normalisePhone(phone?: string | null): string {
  let p = String(phone || '').replace(/[^\d+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0') && p.length === 11) p = `234${p.slice(1)}`; // Nigerian local format
  return p;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function brandEmailHtml(brand: BrandInfo, title: string, bodyHtml: string, cta?: { url: string; label: string }): string {
  const color = brand.primaryColor || '#4f46e5';
  const site = (process.env.FRONTEND_URL || 'https://www.maxhubng.company').replace(/\/$/, '');
  const logoSrc = brand.logoUrl ? (/^https?:/.test(brand.logoUrl) ? brand.logoUrl : `${site}${brand.logoUrl.startsWith('/') ? '' : '/'}${brand.logoUrl}`) : '';
  const logo = logoSrc ? `<div style="background:#fff;display:inline-block;padding:6px 10px;border-radius:8px;margin-bottom:8px"><img src="${logoSrc}" alt="${brand.displayName}" style="max-height:48px;display:block"/></div>` : '';
  return `<!DOCTYPE html><html><body style="margin:0;background:#f4f5f7;font-family:Segoe UI,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">
<tr><td style="background:${color};padding:24px 32px;color:#fff">${logo}<div style="font-size:18px;font-weight:700">${brand.displayName}</div>
${brand.tagline ? `<div style="font-size:12px;opacity:.85">${brand.tagline}</div>` : ''}</td></tr>
<tr><td style="padding:28px 32px;color:#1f2937;font-size:14px;line-height:1.65"><h2 style="margin:0 0 12px;font-size:18px">${title}</h2>${bodyHtml}
${cta ? `<p style="margin:24px 0 0"><a href="${cta.url}" style="background:${color};color:#fff;text-decoration:none;padding:12px 26px;border-radius:8px;font-weight:600;display:inline-block">${cta.label}</a></p>` : ''}
</td></tr>
<tr><td style="background:#f9fafb;padding:16px 32px;font-size:11px;color:#6b7280">${[brand.address, brand.phone, brand.email, brand.website].filter(Boolean).join(' · ')}</td></tr>
</table></td></tr></table></body></html>`;
}

export async function sendBrandEmail(brand: BrandInfo, to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const own = brand.code && process.env[`BRAND_${brand.code}_SMTP_USER`] && process.env[`BRAND_${brand.code}_SMTP_PASS`];
    const creds = own
      ? { user: process.env[`BRAND_${brand.code}_SMTP_USER`]!, pass: process.env[`BRAND_${brand.code}_SMTP_PASS`]! }
      : resolveMailboxCredentials('INFO_EMAIL', 'INFO_PASSWORD');
    const transporter = getOrCreateTransporter(creds.user, creds.pass);
    const fromAddress = own ? creds.user : (process.env.INFO_FROM || process.env.INFO_EMAIL || creds.user);
    // Reply-To the brand mailbox so customers' replies reach the right team.
    const ok = await sendViaTransporter(transporter, { name: brand.displayName, address: fromAddress }, {
      to, subject, html, ...(brand.email ? { replyTo: brand.email } : {}),
    } as any);
    return { ok: !!ok, error: ok ? undefined : 'Mail server rejected the message' };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function sendWhatsAppText(phone: string, text: string): Promise<{ ok: boolean; mode: 'api' | 'link'; link: string; error?: string }> {
  const link = waLink(phone, text);
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { ok: true, mode: 'link', link };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: normalisePhone(phone), type: 'text', text: { preview_url: true, body: text } }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, mode: 'api', link, error: `WhatsApp API ${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { ok: true, mode: 'api', link };
  } catch (e: any) {
    return { ok: false, mode: 'api', link, error: e.message };
  }
}

export function fillPlaceholders(body: string, vars: Record<string, any>): string {
  return (body || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => (vars[k] !== undefined && vars[k] !== null && vars[k] !== '' ? escapeHtml(String(vars[k])) : '—'));
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

/** Strips scripts, event handlers and javascript: URLs from staff-authored HTML before it is shown to customers. */
export function sanitizeHtml(html: string): string {
  return String(html || '')
    .replace(/<\s*(script|style|iframe|object|embed|form|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|link|meta)[^>]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*/gi, '$1=$2#');
}
