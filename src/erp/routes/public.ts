import { Router, Request, Response, NextFunction } from 'express';
import { Op, QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ErpModels } from '../models';
import { wrap, ok, fail } from '../recordRouter';
import { db, departmentFamily, emitChange, notifyUsers, resolveDepartmentId, sha256, userIdsWithRoles } from '../helpers';
import { brandEmailHtml, brandForDepartment, escapeHtml, sendBrandEmail } from '../outbound';
import { rateLimit } from '../rateLimit';

/**
 * Public endpoints (no login): careers feed for the brand websites, the
 * customer document-signing page, public policies and order tracking.
 */

const BRAND_UNITS: Record<string, string> = { VM: 'VM', KS: 'KS', 'KS-ICT': 'KS', 'KS-TRN': 'KS', BM: 'BM', 'BM-DSN': 'BM', 'BM-VOC': 'BM', MF: 'MF' };

function cors(req: Request, res: Response, next: NextFunction) {
  // The careers feed is meant to be embedded on the brand websites.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '7200');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

async function openJobsWhere(brand?: string) {
  const where: any = { status: 'Open', closingDate: { [Op.gte]: new Date(new Date().toDateString()) } };
  if (brand) {
    const unit = BRAND_UNITS[brand.toUpperCase()];
    const dept = await resolveDepartmentId(brand);
    const fam = dept ? await departmentFamily(dept) : [];
    where[Op.or] = [...(unit ? [{ businessUnit: unit }] : []), ...(fam.length ? [{ departmentId: { [Op.in]: fam } }] : [])];
    if (!where[Op.or].length) delete where[Op.or];
  }
  return where;
}

function publicJob(j: any, brandName?: string) {
  return {
    code: j.jobCode, title: j.title, brand: j.businessUnit, brandName, description: j.description, jobType: j.jobType,
    positions: j.noOfPositions, location: j.location, salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: j.currency,
    experience: j.requiredExperience, qualifications: j.qualifications, skills: j.skills, benefits: j.benefits,
    postedDate: j.postedDate, closingDate: j.closingDate,
  };
}

export function publicRouter(): Router {
  const r = Router();
  r.use(cors);
  r.use(rateLimit('public', 120, 60_000));

  // ── Careers ───────────────────────────────────────────────────────────────
  r.get('/jobs', wrap(async (req, res) => {
    const { JobPosting } = require('@models/JobPosting.model');
    const rows = await JobPosting.findAll({ where: await openJobsWhere(req.query.brand as string), order: [['postedDate', 'DESC']], limit: 100 });
    const names: Record<string, string> = { VM: 'VisaMax Travels', KS: 'Kurios SAT', BM: 'BeadMax Design', MF: 'Maxfood Farm' };
    res.setHeader('Cache-Control', 'public, max-age=120');
    return ok(res, rows.map((j: any) => publicJob(j, names[j.businessUnit] || 'MaxHub')));
  }));

  // Drop-in widget: <div id="maxhub-careers"></div><script src=".../api/public/jobs/widget.js?brand=VM"></script>
  r.get('/jobs/widget.js', (req, res) => {
    const brand = String(req.query.brand || '').replace(/[^A-Za-z-]/g, '').toUpperCase();
    const color = String(req.query.color || '#1d3a8f').replace(/[^#a-fA-F0-9]/g, '').slice(0, 7);
    const api = `${req.protocol}://${req.get('host')}/api/public`;
    res.type('application/javascript').setHeader('Cache-Control', 'public, max-age=300');
    res.send(widgetJs(api, brand, color));
  });

  r.get('/jobs/:code', wrap(async (req, res) => {
    const { JobPosting } = require('@models/JobPosting.model');
    const j = await JobPosting.findOne({ where: { jobCode: req.params.code, status: 'Open' } });
    if (!j) return fail(res, 404, 'This position is no longer open');
    return ok(res, publicJob(j));
  }));

  r.post('/jobs/:code/apply', rateLimit('apply', 5, 60 * 60_000), wrap(async (req, res) => {
    const { JobPosting } = require('@models/JobPosting.model');
    const j: any = await JobPosting.findOne({ where: { jobCode: req.params.code, status: 'Open' } });
    if (!j || new Date(j.closingDate) < new Date(new Date().toDateString())) return fail(res, 404, 'This position is no longer open');
    const name = String(req.body.name || '').trim().slice(0, 150);
    const email = String(req.body.email || '').trim().toLowerCase().slice(0, 200);
    const phone = String(req.body.phone || '').trim().slice(0, 30);
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.length < 7) return fail(res, 400, 'Please provide your name, a valid email and phone number');
    const resumeUrl = /^https:\/\//.test(String(req.body.resumeUrl || '')) ? String(req.body.resumeUrl).slice(0, 1000) : null;
    const dup: any[] = await db.query(`SELECT id FROM job_applications WHERE "jobPostingId" = :j AND LOWER("applicantEmail") = :e AND "deletedAt" IS NULL LIMIT 1`, { replacements: { j: j.id, e: email }, type: QueryTypes.SELECT });
    if (dup[0]) return fail(res, 409, 'You have already applied for this position');
    const [first, ...rest] = name.split(' ');
    let contact: any[] = await db.query(`SELECT id FROM contacts WHERE LOWER(email) = :e AND "deletedAt" IS NULL LIMIT 1`, { replacements: { e: email }, type: QueryTypes.SELECT });
    if (!contact[0]) {
      contact = await db.query(
        `INSERT INTO contacts (uuid, "contactCode", "firstName", "lastName", email, phone, source, status, notes, "createdAt", "updatedAt")
         VALUES (:uuid, :code, :f, :l, :e, :p, 'Website', 'Lead', 'Job applicant (careers page)', NOW(), NOW()) RETURNING id`,
        { replacements: { uuid: uuidv4(), code: `APP-${Date.now().toString(36).toUpperCase()}`, f: first, l: rest.join(' ') || '-', e: email, p: phone }, type: QueryTypes.SELECT },
      );
    }
    await db.query(
      `INSERT INTO job_applications (uuid, "jobPostingId", "contactId", "applicantName", "applicantEmail", "applicantPhone", "resumeUrl", "applicationDate", status, source, notes, "createdAt", "updatedAt")
       VALUES (:uuid, :j, :c, :n, :e, :p, :r, NOW(), 'Applied', :src, :notes, NOW(), NOW())`,
      { replacements: { uuid: uuidv4(), j: j.id, c: contact[0].id, n: name, e: email, p: phone, r: resumeUrl, src: `Website (${req.get('origin') || 'careers'})`.slice(0, 100), notes: String(req.body.coverLetter || '').slice(0, 5000) || null } },
    );
    const hr = await userIdsWithRoles(['hr', 'admin', 'superadmin']);
    await notifyUsers(req, hr, { title: 'New job application', message: `${name} applied for ${j.title} (${j.jobCode}) via the website.`, type: 'Alert', actionUrl: '/hr/recruitment' });
    emitChange(req, 'job_application', 'created');
    return ok(res, null, 'Thank you! Your application has been received.', 201);
  }));

  // ── BeadMax online shop (beadmax.net) ─────────────────────────────────────
  const publicProduct = (p: any) => ({
    id: Number(p.id), code: p.code, slug: p.slug, name: p.name, category: p.category, description: p.description,
    material: p.material, colour: p.colour, size: p.size, unit: p.unit,
    price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null, currency: p.currency,
    images: Array.isArray(p.images) ? p.images : [], inStock: Number(p.stockQty) > 0 || !!p.madeToOrder,
    stock: Math.max(0, Math.floor(Number(p.stockQty))), madeToOrder: !!p.madeToOrder, leadTimeDays: p.leadTimeDays,
    featured: !!p.isFeatured, weightGrams: p.weightGrams,
  });

  r.get('/shop/beadmax/products', wrap(async (req, res) => {
    const where: string[] = [`"isPublished" = true`, `"isActive" = true`, `kind = 'Finished product'`];
    const rep: any = {};
    if (req.query.category) { where.push('category = :cat'); rep.cat = String(req.query.category); }
    if (req.query.q) { where.push('(name ILIKE :q OR description ILIKE :q OR material ILIKE :q OR colour ILIKE :q)'); rep.q = `%${String(req.query.q).slice(0, 80)}%`; }
    if (req.query.featured === '1') where.push(`"isFeatured" = true`);
    const rows: any[] = await db.query(`SELECT * FROM erp_shop_products WHERE ${where.join(' AND ')} ORDER BY "isFeatured" DESC, "updatedAt" DESC LIMIT 300`, { replacements: rep, type: QueryTypes.SELECT });
    const cats: any[] = await db.query(`SELECT category, COUNT(*)::int n FROM erp_shop_products WHERE "isPublished" = true AND "isActive" = true AND kind = 'Finished product' GROUP BY category ORDER BY category`, { type: QueryTypes.SELECT });
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json({ success: true, data: rows.map(publicProduct), categories: cats.map((c) => ({ name: c.category, count: c.n })) });
  }));

  r.get('/shop/beadmax/products/:slug', wrap(async (req, res) => {
    const rows: any[] = await db.query(
      `SELECT * FROM erp_shop_products WHERE (slug = :s OR code = :s) AND "isPublished" = true AND "isActive" = true LIMIT 1`,
      { replacements: { s: req.params.slug }, type: QueryTypes.SELECT },
    );
    if (!rows[0]) return fail(res, 404, 'This item is no longer available');
    return ok(res, publicProduct(rows[0]));
  }));

  r.get('/shop/beadmax/settings', wrap(async (_req, res) => {
    const s: any = await (ErpModels.Setting as any).findByPk('beadmaxShop', { raw: true }).catch(() => null);
    const v = s?.value || {};
    const brand = await brandForDepartment(await resolveDepartmentId('BM'));
    return ok(res, {
      currency: 'NGN',
      deliveryFees: v.deliveryFees || { Lagos: 3000, 'Other states': 6000, Pickup: 0 },
      bank: v.bank || null,
      whatsapp: brand.whatsapp || brand.phone || null, email: brand.email || null,
      paymentMethods: v.paymentMethods || ['Bank transfer', 'Pay on delivery (Lagos only)'],
    });
  }));

  /** Places an order. Prices and stock are checked here, never trusted from the browser. */
  r.post('/shop/beadmax/orders', rateLimit('shop-order', 10, 60 * 60_000), wrap(async (req, res) => {
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 150);
    const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
    const phone = String(b.phone || '').trim().slice(0, 30);
    if (!name || phone.length < 7 || (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) return fail(res, 400, 'Please give your name, phone number and a valid email');
    const wanted = (Array.isArray(b.items) ? b.items : []).slice(0, 50).map((i: any) => ({ id: Number(i.productId || i.id), qty: Math.max(1, Math.min(100, Math.floor(Number(i.qty) || 1))) })).filter((i: any) => i.id);
    if (!wanted.length) return fail(res, 400, 'Your basket is empty');
    const products: any[] = await db.query(`SELECT * FROM erp_shop_products WHERE id IN (:ids) AND "isPublished" = true AND "isActive" = true`, { replacements: { ids: wanted.map((w: any) => w.id) }, type: QueryTypes.SELECT });
    const items: any[] = [];
    for (const w of wanted) {
      const p = products.find((x) => Number(x.id) === w.id);
      if (!p) return fail(res, 409, 'An item in your basket is no longer available. Please refresh the page.');
      if (!p.madeToOrder && Number(p.stockQty) < w.qty) return fail(res, 409, `Only ${Math.max(0, Math.floor(Number(p.stockQty)))} of “${p.name}” left`);
      items.push({ productId: Number(p.id), code: p.code, name: p.name, qty: w.qty, price: Number(p.price), image: Array.isArray(p.images) ? p.images[0] : null });
    }
    const delivery = String(b.deliveryMethod || 'Delivery') === 'Pick-up' ? 'Pick-up' : 'Delivery';
    const settings: any = (await (ErpModels.Setting as any).findByPk('beadmaxShop', { raw: true }).catch(() => null))?.value || {};
    const fees = settings.deliveryFees || { Lagos: 3000, 'Other states': 6000, Pickup: 0 };
    const state = String(b.state || '').trim().slice(0, 100);
    const deliveryFee = delivery === 'Pick-up' ? 0 : Number(/lagos/i.test(state) ? fees.Lagos : fees['Other states']) || 0;
    const dept = await resolveDepartmentId('BM-DSN') || await resolveDepartmentId('BM');
    const { nextCode } = require('../helpers');
    const { shopTotals } = require('../inventory');
    const data: any = {
      customerName: name, customerEmail: email || null, customerPhone: phone, customerWhatsapp: String(b.whatsapp || phone).slice(0, 40),
      customerCountry: String(b.country || 'Nigeria').slice(0, 100),
      deliveryAddress: String(b.address || '').slice(0, 1000) || null, city: String(b.city || '').slice(0, 100) || null, state: state || null,
      deliveryMethod: delivery, items, deliveryFee, discount: 0, currency: 'NGN',
      paymentMethod: /delivery/i.test(String(b.paymentMethod || '')) ? 'Pay on delivery' : 'Bank transfer',
      stage: 'New', source: 'Website', customerNote: String(b.note || '').slice(0, 2000) || null, departmentId: dept,
      meta: { origin: req.get('origin') || null, ip: (req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0] },
    };
    shopTotals(data);
    data.code = await nextCode('BMX-WEB');
    const order: any = await (ErpModels.ShopOrder as any).create(data);
    await (ErpModels.Activity as any).create({ entityType: 'shop_order', entityId: order.id, departmentId: dept, kind: 'System', content: `Order placed on the website (${items.length} item${items.length > 1 ? 's' : ''}, ₦${Number(order.total).toLocaleString()})`, createdByName: name });
    const { departmentHeadUserIds } = require('../helpers');
    const staff = [...(await departmentHeadUserIds(dept)), ...(await userIdsWithRoles(['superadmin', 'admin']))];
    await notifyUsers(req, staff, { title: `New BeadMax order ${order.code}`, message: `${name} ordered ${items.map((i) => `${i.qty}× ${i.name}`).join(', ')} — ₦${Number(order.total).toLocaleString()}`, type: 'Alert', priority: 'High', actionUrl: `/beadmax/shop?open=${order.id}` });
    emitChange(req, 'shop_order', 'created', order);
    if (email) {
      const brand = await brandForDepartment(dept);
      const rows = items.map((i) => `<tr><td style="padding:6px 0">${i.qty} × ${escapeHtml(i.name)}</td><td style="text-align:right">₦${(i.qty * i.price).toLocaleString()}</td></tr>`).join('');
      const bank = settings.bank ? `<p><b>Pay by transfer to:</b><br>${escapeHtml(settings.bank.bankName || '')}<br>${escapeHtml(settings.bank.accountName || '')}<br>${escapeHtml(settings.bank.accountNumber || '')}<br>Use <b>${order.code}</b> as the reference.</p>` : '';
      sendBrandEmail(brand, email, `We received your order ${order.code}`, brandEmailHtml(brand, 'Thank you for your order', `
        <p>Hello ${escapeHtml(name)},</p><p>We have received your order <b>${order.code}</b>. We will call or WhatsApp you shortly to confirm.</p>
        <table width="100%" style="border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding:6px 0">Delivery</td><td style="text-align:right">₦${Number(order.deliveryFee).toLocaleString()}</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #e5e7eb"><b>Total</b></td><td style="text-align:right;border-top:1px solid #e5e7eb"><b>₦${Number(order.total).toLocaleString()}</b></td></tr></table>
        ${order.paymentMethod === 'Bank transfer' ? bank : '<p>You will pay when your order is delivered.</p>'}`)).catch(() => undefined);
    }
    return ok(res, { code: order.code, total: Number(order.total), deliveryFee: Number(order.deliveryFee), paymentMethod: order.paymentMethod, bank: order.paymentMethod === 'Bank transfer' ? settings.bank || null : null }, 'Order received', 201);
  }));

  r.get('/shop/beadmax/orders/:code', rateLimit('shop-track', 30, 10 * 60_000), wrap(async (req, res) => {
    const rows: any[] = await db.query(`SELECT code, stage, "paymentStatus", "trackingNo", total, items, "createdAt", "customerPhone", "customerEmail" FROM erp_shop_orders WHERE code = :c LIMIT 1`, { replacements: { c: String(req.params.code).toUpperCase() }, type: QueryTypes.SELECT });
    const o = rows[0];
    const who = String(req.query.contact || '').trim().toLowerCase();
    if (!o || !who || (who !== String(o.customerEmail || '').toLowerCase() && who.replace(/\D/g, '').slice(-10) !== String(o.customerPhone || '').replace(/\D/g, '').slice(-10))) {
      return fail(res, 404, 'We could not find an order with those details');
    }
    return ok(res, { code: o.code, stage: o.stage, paymentStatus: o.paymentStatus, trackingNo: o.trackingNo, total: Number(o.total), items: (o.items || []).map((i: any) => ({ name: i.name, qty: i.qty })), placedAt: o.createdAt, stages: ['New', 'Confirmed', 'Packed', 'Shipped', 'Delivered'] });
  }));

  // ── Public policies (refund/returns/shipping) for the websites ────────────
  r.get('/policies', wrap(async (req, res) => {
    const where: any = { isActive: true, isPublic: true };
    const dept = await resolveDepartmentId(req.query.brand as string);
    if (dept) where.departmentId = { [Op.in]: await departmentFamily(dept) };
    const rows = await (ErpModels.DocumentTemplate as any).findAll({ where, attributes: ['id', 'title', 'category', 'body', 'fileUrl', 'version', 'updatedAt'] });
    return ok(res, rows);
  }));

  // ── Customer document signing ─────────────────────────────────────────────
  const sigLimiter = rateLimit('sign', 30, 10 * 60_000);
  r.get('/sign/:token', sigLimiter, wrap(async (req, res) => {
    const row: any = await (ErpModels.SignatureRequest as any).findOne({ where: { token: req.params.token } });
    if (!row || row.status === 'Cancelled') return fail(res, 404, 'This document link is not valid');
    if (row.status === 'Sent' && row.expiresAt && new Date(row.expiresAt) < new Date()) { await row.update({ status: 'Expired' }); }
    if (row.status === 'Sent') { await row.update({ status: 'Viewed', viewedAt: new Date() }); emitChange(req, 'signature_request', 'updated', row); }
    const brand = await brandForDepartment(row.departmentId);
    return ok(res, {
      code: row.code, title: row.title, category: row.category, recipientName: row.recipientName, body: row.renderedBody, fileUrl: row.fileUrl,
      requiresSignature: row.requiresSignature, status: row.status, signedAt: row.signedAt, signerName: row.signerName,
      signatureImage: ['Signed', 'Acknowledged'].includes(row.status) ? row.signatureImage : null, expiresAt: row.expiresAt, contentHash: row.contentHash,
      brand: { displayName: brand.displayName, logoUrl: brand.logoUrl, primaryColor: brand.primaryColor, address: brand.address, email: brand.email, phone: brand.phone, website: brand.website, tagline: brand.tagline },
    });
  }));

  r.post('/sign/:token', sigLimiter, wrap(async (req, res) => {
    const row: any = await (ErpModels.SignatureRequest as any).findOne({ where: { token: req.params.token } });
    if (!row || row.status === 'Cancelled') return fail(res, 404, 'This document link is not valid');
    if (['Signed', 'Acknowledged', 'Declined'].includes(row.status)) return fail(res, 409, `This document has already been ${row.status.toLowerCase()}`);
    if (row.status === 'Expired' || (row.expiresAt && new Date(row.expiresAt) < new Date())) return fail(res, 410, 'This link has expired — please ask us to resend it');
    if (sha256(`${row.renderedBody || ''}|${row.fileUrl || ''}`) !== row.contentHash) return fail(res, 409, 'This document changed after it was sent. Please ask for a new copy.');
    const ip = ((req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.ip || '').slice(0, 64);
    const ua = String(req.get('user-agent') || '').slice(0, 500);
    if (req.body.decline) {
      await row.update({ status: 'Declined', declineReason: String(req.body.reason || '').slice(0, 2000), signerIp: ip, signerUserAgent: ua, signedAt: new Date() });
    } else {
      const signerName = String(req.body.signerName || '').trim().slice(0, 200);
      if (!req.body.agree) return fail(res, 400, 'Please tick the box to confirm you agree');
      if (!signerName) return fail(res, 400, 'Please type your full name');
      let signatureImage: string | null = null;
      if (row.requiresSignature) {
        signatureImage = String(req.body.signatureImage || '');
        if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signatureImage) || signatureImage.length > 400_000) return fail(res, 400, 'Please draw your signature');
      }
      await row.update({ status: row.requiresSignature ? 'Signed' : 'Acknowledged', signerName, signatureImage, signerIp: ip, signerUserAgent: ua, signedAt: new Date() });
    }
    // Timeline + notify the sender and brand head
    try {
      if (row.relatedType && row.relatedId) await (ErpModels.Activity as any).create({ entityType: row.relatedType, entityId: row.relatedId, departmentId: row.departmentId, kind: 'Document', content: `Customer ${row.status.toLowerCase()} "${row.title}" (${row.code})`, createdByName: row.recipientName });
    } catch { /* ignore */ }
    const recipients = [Number(row.sentById)].filter(Boolean);
    await notifyUsers(req, recipients, { title: `Document ${row.status.toLowerCase()}`, message: `${row.recipientName} ${row.status.toLowerCase()} "${row.title}" (${row.code}).`, type: 'Alert', priority: row.status === 'Declined' ? 'High' : 'Medium', actionUrl: `/documents?request=${row.id}` });
    emitChange(req, 'signature_request', 'updated', row);
    if (row.status !== 'Declined' && row.recipientEmail) {
      const brand = await brandForDepartment(row.departmentId);
      sendBrandEmail(brand, row.recipientEmail, `Your signed copy: ${row.title}`, brandEmailHtml(brand, 'Thank you', `<p>Dear ${escapeHtml(row.recipientName)},</p><p>We have received your ${row.requiresSignature ? 'signed' : 'acknowledged'} copy of <strong>${escapeHtml(row.title)}</strong> (${row.code}) on ${new Date().toUTCString()}.</p><p>You can view or print it any time using the link below.</p>`, { url: `${(process.env.FRONTEND_URL || 'https://www.maxhubng.company').replace(/\/$/, '')}/sign/${row.token}`, label: 'View signed document' })).catch(() => undefined);
    }
    return ok(res, { status: row.status, signedAt: row.signedAt }, row.status === 'Declined' ? 'Response recorded' : 'Thank you — your document has been received');
  }));

  // ── Customer tracking (export orders, travel cases, custom orders, projects) ──
  r.get('/track/:code', rateLimit('track', 20, 10 * 60_000), wrap(async (req, res) => {
    const code = String(req.params.code).toUpperCase();
    const contact = String(req.query.contact || '').trim().toLowerCase();
    if (contact.length < 4) return fail(res, 400, 'Enter the email or the last 4 digits of the phone number used for the order');
    const map: [string, string, string][] = [['ExportOrder', 'export_order', 'stage'], ['TravelCase', 'travel_case', 'stage'], ['CustomOrder', 'custom_order', 'stage'], ['TechProject', 'tech_project', 'stage']];
    for (const [model, entity, field] of map) {
      const row: any = await (ErpModels[model] as any).findOne({ where: { code } });
      if (!row) continue;
      const phone = String(row.customerPhone || row.customerWhatsapp || '').replace(/\D/g, '');
      const matches = (row.customerEmail && row.customerEmail.toLowerCase() === contact) || (/^\d{4,}$/.test(contact) && phone.endsWith(contact));
      if (!matches) break;
      const history = await (ErpModels.Activity as any).findAll({ where: { entityType: entity, entityId: row.id, kind: 'StageChange' }, order: [['createdAt', 'ASC']], attributes: ['content', 'createdAt', 'meta'] });
      const brand = await brandForDepartment(row.departmentId);
      return ok(res, {
        code: row.code, type: entity, status: row[field], customerName: row.customerName, updatedAt: row.updatedAt,
        destination: row.destinationCountry, trackingNo: row.trackingNo, carrier: row.carrier, expectedDelivery: row.expectedDelivery,
        history: history.map((h: any) => ({ to: h.meta?.to, at: h.createdAt })), brand: { displayName: brand.displayName, phone: brand.phone, email: brand.email },
      });
    }
    return fail(res, 404, 'We could not find a record with that code and contact');
  }));

  return r;
}

function widgetJs(api: string, brand: string, color: string): string {
  return `(function(){
var API=${JSON.stringify(api)},BRAND=${JSON.stringify(brand)},C=${JSON.stringify(color)};
var root=document.getElementById('maxhub-careers');if(!root){root=document.createElement('div');root.id='maxhub-careers';(document.currentScript&&document.currentScript.parentNode||document.body).appendChild(root);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
var css='.mxc{font-family:inherit;max-width:900px;margin:0 auto}.mxc-h{display:flex;align-items:center;gap:8px;margin:0 0 14px}.mxc-badge{background:'+C+';color:#fff;border-radius:999px;padding:2px 10px;font-size:12px}.mxc-card{border:1px solid #e5e7eb;border-radius:12px;padding:16px 18px;margin:0 0 12px;background:#fff}.mxc-t{font-weight:700;font-size:17px;margin:0 0 4px;color:#111}.mxc-m{color:#555;font-size:13px;margin:0 0 8px}.mxc-d{white-space:pre-line;font-size:14px;color:#333;display:none;margin:8px 0}.mxc-b{background:'+C+';color:#fff;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:14px;margin-right:6px}.mxc-o{background:#fff;color:'+C+';border:1px solid '+C+'}.mxc-f{display:none;margin-top:10px}.mxc-f input,.mxc-f textarea{width:100%;box-sizing:border-box;padding:9px;border:1px solid #d1d5db;border-radius:8px;margin:0 0 8px;font:inherit}.mxc-msg{font-size:14px;margin-top:6px}';
var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
root.innerHTML='<div class="mxc"><p>Loading open positions…</p></div>';
fetch(API+'/jobs'+(BRAND?'?brand='+BRAND:'')).then(function(r){return r.json()}).then(function(j){
var jobs=(j&&j.data)||[];var box=root.firstChild;
if(!jobs.length){box.innerHTML='<p>We are not recruiting at the moment. Please check back soon.</p>';return;}
box.innerHTML='<div class="mxc-h"><strong>We are recruiting</strong><span class="mxc-badge">'+jobs.length+' open</span></div>'+jobs.map(function(x,i){
var sal=x.salaryMin?(' · '+esc(x.currency||'')+' '+Number(x.salaryMin).toLocaleString()+(x.salaryMax?'–'+Number(x.salaryMax).toLocaleString():'')):'';
return '<div class="mxc-card"><p class="mxc-t">'+esc(x.title)+'</p><p class="mxc-m">'+esc(x.jobType)+' · '+esc(x.location||'Lagos')+sal+' · Closes '+new Date(x.closingDate).toDateString()+'</p>'+
'<div class="mxc-d" id="mxd'+i+'">'+esc(x.description)+(x.qualifications?'\\n\\nQualifications:\\n'+esc(x.qualifications):'')+(x.skills?'\\n\\nSkills:\\n'+esc(x.skills):'')+'</div>'+
'<button class="mxc-b mxc-o" data-d="'+i+'">Details</button><button class="mxc-b" data-a="'+i+'">Apply</button>'+
'<form class="mxc-f" id="mxf'+i+'" data-code="'+esc(x.code)+'"><input name="name" placeholder="Full name" required><input name="email" type="email" placeholder="Email" required><input name="phone" placeholder="Phone / WhatsApp" required><input name="resumeUrl" placeholder="Link to your CV (Google Drive, Dropbox…)"><textarea name="coverLetter" rows="4" placeholder="Short cover letter"></textarea><button class="mxc-b" type="submit">Submit application</button><div class="mxc-msg"></div></form></div>';}).join('');
box.addEventListener('click',function(e){var t=e.target;if(t.dataset.d!=null){var d=document.getElementById('mxd'+t.dataset.d);d.style.display=d.style.display==='block'?'none':'block';}if(t.dataset.a!=null){var f=document.getElementById('mxf'+t.dataset.a);f.style.display=f.style.display==='block'?'none':'block';}});
box.addEventListener('submit',function(e){e.preventDefault();var f=e.target,m=f.querySelector('.mxc-msg'),b=f.querySelector('button');var data={};new FormData(f).forEach(function(v,k){data[k]=v});b.disabled=true;m.textContent='Sending…';
fetch(API+'/jobs/'+encodeURIComponent(f.dataset.code)+'/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(function(r){return r.json()}).then(function(r){m.textContent=r.message||'Done';m.style.color=r.success?'green':'crimson';if(r.success)f.reset();b.disabled=false;}).catch(function(){m.textContent='Network error, please try again.';b.disabled=false;});});
}).catch(function(){root.firstChild.innerHTML='<p>Unable to load positions right now.</p>';});
})();`;
}
