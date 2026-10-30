"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicRouter = publicRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../models");
const recordRouter_1 = require("../recordRouter");
const helpers_1 = require("../helpers");
const outbound_1 = require("../outbound");
const rateLimit_1 = require("../rateLimit");
const BRAND_UNITS = { VM: 'VM', KS: 'KS', 'KS-ICT': 'KS', 'KS-TRN': 'KS', BM: 'BM', 'BM-DSN': 'BM', 'BM-VOC': 'BM', MF: 'MF' };
function cors(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '7200');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (req.method === 'OPTIONS')
        return res.sendStatus(204);
    next();
}
async function openJobsWhere(brand) {
    const where = { status: 'Open', closingDate: { [sequelize_1.Op.gte]: new Date(new Date().toDateString()) } };
    if (brand) {
        const unit = BRAND_UNITS[brand.toUpperCase()];
        const dept = await (0, helpers_1.resolveDepartmentId)(brand);
        const fam = dept ? await (0, helpers_1.departmentFamily)(dept) : [];
        where[sequelize_1.Op.or] = [...(unit ? [{ businessUnit: unit }] : []), ...(fam.length ? [{ departmentId: { [sequelize_1.Op.in]: fam } }] : [])];
        if (!where[sequelize_1.Op.or].length)
            delete where[sequelize_1.Op.or];
    }
    return where;
}
function publicJob(j, brandName) {
    return {
        code: j.jobCode, title: j.title, brand: j.businessUnit, brandName, description: j.description, jobType: j.jobType,
        positions: j.noOfPositions, location: j.location, salaryMin: j.salaryMin, salaryMax: j.salaryMax, currency: j.currency,
        experience: j.requiredExperience, qualifications: j.qualifications, skills: j.skills, benefits: j.benefits,
        postedDate: j.postedDate, closingDate: j.closingDate,
    };
}
function publicRouter() {
    const r = (0, express_1.Router)();
    r.use(cors);
    r.use((0, rateLimit_1.rateLimit)('public', 120, 60000));
    r.get('/jobs', (0, recordRouter_1.wrap)(async (req, res) => {
        const { JobPosting } = require('../../models/JobPosting.model');
        const rows = await JobPosting.findAll({ where: await openJobsWhere(req.query.brand), order: [['postedDate', 'DESC']], limit: 100 });
        const names = { VM: 'VisaMax Travels', KS: 'Kurios SAT', BM: 'BeadMax Design', MF: 'Maxfood Farm' };
        res.setHeader('Cache-Control', 'public, max-age=120');
        return (0, recordRouter_1.ok)(res, rows.map((j) => publicJob(j, names[j.businessUnit] || 'MaxHub')));
    }));
    r.get('/jobs/widget.js', (req, res) => {
        const brand = String(req.query.brand || '').replace(/[^A-Za-z-]/g, '').toUpperCase();
        const color = String(req.query.color || '#1d3a8f').replace(/[^#a-fA-F0-9]/g, '').slice(0, 7);
        const api = `${req.protocol}://${req.get('host')}/api/public`;
        res.type('application/javascript').setHeader('Cache-Control', 'public, max-age=300');
        res.send(widgetJs(api, brand, color));
    });
    r.get('/jobs/:code', (0, recordRouter_1.wrap)(async (req, res) => {
        const { JobPosting } = require('../../models/JobPosting.model');
        const j = await JobPosting.findOne({ where: { jobCode: req.params.code, status: 'Open' } });
        if (!j)
            return (0, recordRouter_1.fail)(res, 404, 'This position is no longer open');
        return (0, recordRouter_1.ok)(res, publicJob(j));
    }));
    r.post('/jobs/:code/apply', (0, rateLimit_1.rateLimit)('apply', 5, 60 * 60000), (0, recordRouter_1.wrap)(async (req, res) => {
        const { JobPosting } = require('../../models/JobPosting.model');
        const j = await JobPosting.findOne({ where: { jobCode: req.params.code, status: 'Open' } });
        if (!j || new Date(j.closingDate) < new Date(new Date().toDateString()))
            return (0, recordRouter_1.fail)(res, 404, 'This position is no longer open');
        const name = String(req.body.name || '').trim().slice(0, 150);
        const email = String(req.body.email || '').trim().toLowerCase().slice(0, 200);
        const phone = String(req.body.phone || '').trim().slice(0, 30);
        if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.length < 7)
            return (0, recordRouter_1.fail)(res, 400, 'Please provide your name, a valid email and phone number');
        const resumeUrl = /^https:\/\//.test(String(req.body.resumeUrl || '')) ? String(req.body.resumeUrl).slice(0, 1000) : null;
        const dup = await helpers_1.db.query(`SELECT id FROM job_applications WHERE "jobPostingId" = :j AND LOWER("applicantEmail") = :e AND "deletedAt" IS NULL LIMIT 1`, { replacements: { j: j.id, e: email }, type: sequelize_1.QueryTypes.SELECT });
        if (dup[0])
            return (0, recordRouter_1.fail)(res, 409, 'You have already applied for this position');
        const [first, ...rest] = name.split(' ');
        let contact = await helpers_1.db.query(`SELECT id FROM contacts WHERE LOWER(email) = :e AND "deletedAt" IS NULL LIMIT 1`, { replacements: { e: email }, type: sequelize_1.QueryTypes.SELECT });
        if (!contact[0]) {
            contact = await helpers_1.db.query(`INSERT INTO contacts (uuid, "contactCode", "firstName", "lastName", email, phone, source, status, notes, "createdAt", "updatedAt")
         VALUES (:uuid, :code, :f, :l, :e, :p, 'Website', 'Lead', 'Job applicant (careers page)', NOW(), NOW()) RETURNING id`, { replacements: { uuid: (0, uuid_1.v4)(), code: `APP-${Date.now().toString(36).toUpperCase()}`, f: first, l: rest.join(' ') || '-', e: email, p: phone }, type: sequelize_1.QueryTypes.SELECT });
        }
        await helpers_1.db.query(`INSERT INTO job_applications (uuid, "jobPostingId", "contactId", "applicantName", "applicantEmail", "applicantPhone", "resumeUrl", "applicationDate", status, source, notes, "createdAt", "updatedAt")
       VALUES (:uuid, :j, :c, :n, :e, :p, :r, NOW(), 'Applied', :src, :notes, NOW(), NOW())`, { replacements: { uuid: (0, uuid_1.v4)(), j: j.id, c: contact[0].id, n: name, e: email, p: phone, r: resumeUrl, src: `Website (${req.get('origin') || 'careers'})`.slice(0, 100), notes: String(req.body.coverLetter || '').slice(0, 5000) || null } });
        const hr = await (0, helpers_1.userIdsWithRoles)(['hr', 'admin', 'superadmin']);
        await (0, helpers_1.notifyUsers)(req, hr, { title: 'New job application', message: `${name} applied for ${j.title} (${j.jobCode}) via the website.`, type: 'Alert', actionUrl: '/hr/recruitment' });
        (0, helpers_1.emitChange)(req, 'job_application', 'created');
        return (0, recordRouter_1.ok)(res, null, 'Thank you! Your application has been received.', 201);
    }));
    const publicProduct = (p) => ({
        id: Number(p.id), code: p.code, slug: p.slug, name: p.name, category: p.category, description: p.description,
        material: p.material, colour: p.colour, size: p.size, unit: p.unit,
        price: Number(p.price), compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null, currency: p.currency,
        images: Array.isArray(p.images) ? p.images : [], inStock: Number(p.stockQty) > 0 || !!p.madeToOrder,
        stock: Math.max(0, Math.floor(Number(p.stockQty))), madeToOrder: !!p.madeToOrder, leadTimeDays: p.leadTimeDays,
        featured: !!p.isFeatured, weightGrams: p.weightGrams,
    });
    r.get('/shop/beadmax/products', (0, recordRouter_1.wrap)(async (req, res) => {
        const where = [`"isPublished" = true`, `"isActive" = true`, `kind = 'Finished product'`];
        const rep = {};
        if (req.query.category) {
            where.push('category = :cat');
            rep.cat = String(req.query.category);
        }
        if (req.query.q) {
            where.push('(name ILIKE :q OR description ILIKE :q OR material ILIKE :q OR colour ILIKE :q)');
            rep.q = `%${String(req.query.q).slice(0, 80)}%`;
        }
        if (req.query.featured === '1')
            where.push(`"isFeatured" = true`);
        const rows = await helpers_1.db.query(`SELECT * FROM erp_shop_products WHERE ${where.join(' AND ')} ORDER BY "isFeatured" DESC, "updatedAt" DESC LIMIT 300`, { replacements: rep, type: sequelize_1.QueryTypes.SELECT });
        const cats = await helpers_1.db.query(`SELECT category, COUNT(*)::int n FROM erp_shop_products WHERE "isPublished" = true AND "isActive" = true AND kind = 'Finished product' GROUP BY category ORDER BY category`, { type: sequelize_1.QueryTypes.SELECT });
        res.setHeader('Cache-Control', 'public, max-age=60');
        return res.json({ success: true, data: rows.map(publicProduct), categories: cats.map((c) => ({ name: c.category, count: c.n })) });
    }));
    r.get('/shop/beadmax/products/:slug', (0, recordRouter_1.wrap)(async (req, res) => {
        const rows = await helpers_1.db.query(`SELECT * FROM erp_shop_products WHERE (slug = :s OR code = :s) AND "isPublished" = true AND "isActive" = true LIMIT 1`, { replacements: { s: req.params.slug }, type: sequelize_1.QueryTypes.SELECT });
        if (!rows[0])
            return (0, recordRouter_1.fail)(res, 404, 'This item is no longer available');
        return (0, recordRouter_1.ok)(res, publicProduct(rows[0]));
    }));
    r.get('/shop/beadmax/settings', (0, recordRouter_1.wrap)(async (_req, res) => {
        const s = await models_1.ErpModels.Setting.findByPk('beadmaxShop', { raw: true }).catch(() => null);
        const v = s?.value || {};
        const brand = await (0, outbound_1.brandForDepartment)(await (0, helpers_1.resolveDepartmentId)('BM'));
        return (0, recordRouter_1.ok)(res, {
            currency: 'NGN',
            deliveryFees: v.deliveryFees || { Lagos: 3000, 'Other states': 6000, Pickup: 0 },
            bank: v.bank || null,
            whatsapp: brand.whatsapp || brand.phone || null, email: brand.email || null,
            paymentMethods: v.paymentMethods || ['Bank transfer', 'Pay on delivery (Lagos only)'],
        });
    }));
    r.post('/shop/beadmax/orders', (0, rateLimit_1.rateLimit)('shop-order', 10, 60 * 60000), (0, recordRouter_1.wrap)(async (req, res) => {
        const b = req.body || {};
        const name = String(b.name || '').trim().slice(0, 150);
        const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
        const phone = String(b.phone || '').trim().slice(0, 30);
        if (!name || phone.length < 7 || (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))
            return (0, recordRouter_1.fail)(res, 400, 'Please give your name, phone number and a valid email');
        const wanted = (Array.isArray(b.items) ? b.items : []).slice(0, 50).map((i) => ({ id: Number(i.productId || i.id), qty: Math.max(1, Math.min(100, Math.floor(Number(i.qty) || 1))) })).filter((i) => i.id);
        if (!wanted.length)
            return (0, recordRouter_1.fail)(res, 400, 'Your basket is empty');
        const products = await helpers_1.db.query(`SELECT * FROM erp_shop_products WHERE id IN (:ids) AND "isPublished" = true AND "isActive" = true`, { replacements: { ids: wanted.map((w) => w.id) }, type: sequelize_1.QueryTypes.SELECT });
        const items = [];
        for (const w of wanted) {
            const p = products.find((x) => Number(x.id) === w.id);
            if (!p)
                return (0, recordRouter_1.fail)(res, 409, 'An item in your basket is no longer available. Please refresh the page.');
            if (!p.madeToOrder && Number(p.stockQty) < w.qty)
                return (0, recordRouter_1.fail)(res, 409, `Only ${Math.max(0, Math.floor(Number(p.stockQty)))} of “${p.name}” left`);
            items.push({ productId: Number(p.id), code: p.code, name: p.name, qty: w.qty, price: Number(p.price), image: Array.isArray(p.images) ? p.images[0] : null });
        }
        const delivery = String(b.deliveryMethod || 'Delivery') === 'Pick-up' ? 'Pick-up' : 'Delivery';
        const settings = (await models_1.ErpModels.Setting.findByPk('beadmaxShop', { raw: true }).catch(() => null))?.value || {};
        const fees = settings.deliveryFees || { Lagos: 3000, 'Other states': 6000, Pickup: 0 };
        const state = String(b.state || '').trim().slice(0, 100);
        const deliveryFee = delivery === 'Pick-up' ? 0 : Number(/lagos/i.test(state) ? fees.Lagos : fees['Other states']) || 0;
        const dept = await (0, helpers_1.resolveDepartmentId)('BM-DSN') || await (0, helpers_1.resolveDepartmentId)('BM');
        const { nextCode } = require('../helpers');
        const { shopTotals } = require('../inventory');
        const data = {
            customerName: name, customerEmail: email || null, customerPhone: phone, customerWhatsapp: String(b.whatsapp || phone).slice(0, 40),
            customerCountry: String(b.country || 'Nigeria').slice(0, 100),
            deliveryAddress: String(b.address || '').slice(0, 1000) || null, city: String(b.city || '').slice(0, 100) || null, state: state || null,
            deliveryMethod: delivery, items, deliveryFee, discount: 0, currency: 'NGN',
            paymentMethod: /delivery/i.test(String(b.paymentMethod || '')) ? 'Pay on delivery' : 'Bank transfer',
            stage: 'New', source: 'Website', customerNote: String(b.note || '').slice(0, 2000) || null, departmentId: dept,
            meta: { origin: req.get('origin') || null, ip: (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0] },
        };
        shopTotals(data);
        data.code = await nextCode('BMX-WEB');
        const order = await models_1.ErpModels.ShopOrder.create(data);
        await models_1.ErpModels.Activity.create({ entityType: 'shop_order', entityId: order.id, departmentId: dept, kind: 'System', content: `Order placed on the website (${items.length} item${items.length > 1 ? 's' : ''}, ₦${Number(order.total).toLocaleString()})`, createdByName: name });
        const { departmentHeadUserIds } = require('../helpers');
        const staff = [...(await departmentHeadUserIds(dept)), ...(await (0, helpers_1.userIdsWithRoles)(['superadmin', 'admin']))];
        await (0, helpers_1.notifyUsers)(req, staff, { title: `New BeadMax order ${order.code}`, message: `${name} ordered ${items.map((i) => `${i.qty}× ${i.name}`).join(', ')} — ₦${Number(order.total).toLocaleString()}`, type: 'Alert', priority: 'High', actionUrl: `/beadmax/shop?open=${order.id}` });
        (0, helpers_1.emitChange)(req, 'shop_order', 'created', order);
        if (email) {
            const brand = await (0, outbound_1.brandForDepartment)(dept);
            const rows = items.map((i) => `<tr><td style="padding:6px 0">${i.qty} × ${(0, outbound_1.escapeHtml)(i.name)}</td><td style="text-align:right">₦${(i.qty * i.price).toLocaleString()}</td></tr>`).join('');
            const bank = settings.bank ? `<p><b>Pay by transfer to:</b><br>${(0, outbound_1.escapeHtml)(settings.bank.bankName || '')}<br>${(0, outbound_1.escapeHtml)(settings.bank.accountName || '')}<br>${(0, outbound_1.escapeHtml)(settings.bank.accountNumber || '')}<br>Use <b>${order.code}</b> as the reference.</p>` : '';
            (0, outbound_1.sendBrandEmail)(brand, email, `We received your order ${order.code}`, (0, outbound_1.brandEmailHtml)(brand, 'Thank you for your order', `
        <p>Hello ${(0, outbound_1.escapeHtml)(name)},</p><p>We have received your order <b>${order.code}</b>. We will call or WhatsApp you shortly to confirm.</p>
        <table width="100%" style="border-collapse:collapse;font-size:14px">${rows}
        <tr><td style="padding:6px 0">Delivery</td><td style="text-align:right">₦${Number(order.deliveryFee).toLocaleString()}</td></tr>
        <tr><td style="padding:8px 0;border-top:1px solid #e5e7eb"><b>Total</b></td><td style="text-align:right;border-top:1px solid #e5e7eb"><b>₦${Number(order.total).toLocaleString()}</b></td></tr></table>
        ${order.paymentMethod === 'Bank transfer' ? bank : '<p>You will pay when your order is delivered.</p>'}`)).catch(() => undefined);
        }
        return (0, recordRouter_1.ok)(res, { code: order.code, total: Number(order.total), deliveryFee: Number(order.deliveryFee), paymentMethod: order.paymentMethod, bank: order.paymentMethod === 'Bank transfer' ? settings.bank || null : null }, 'Order received', 201);
    }));
    r.get('/shop/beadmax/orders/:code', (0, rateLimit_1.rateLimit)('shop-track', 30, 10 * 60000), (0, recordRouter_1.wrap)(async (req, res) => {
        const rows = await helpers_1.db.query(`SELECT code, stage, "paymentStatus", "trackingNo", total, items, "createdAt", "customerPhone", "customerEmail" FROM erp_shop_orders WHERE code = :c LIMIT 1`, { replacements: { c: String(req.params.code).toUpperCase() }, type: sequelize_1.QueryTypes.SELECT });
        const o = rows[0];
        const who = String(req.query.contact || '').trim().toLowerCase();
        if (!o || !who || (who !== String(o.customerEmail || '').toLowerCase() && who.replace(/\D/g, '').slice(-10) !== String(o.customerPhone || '').replace(/\D/g, '').slice(-10))) {
            return (0, recordRouter_1.fail)(res, 404, 'We could not find an order with those details');
        }
        return (0, recordRouter_1.ok)(res, { code: o.code, stage: o.stage, paymentStatus: o.paymentStatus, trackingNo: o.trackingNo, total: Number(o.total), items: (o.items || []).map((i) => ({ name: i.name, qty: i.qty })), placedAt: o.createdAt, stages: ['New', 'Confirmed', 'Packed', 'Shipped', 'Delivered'] });
    }));
    r.get('/policies', (0, recordRouter_1.wrap)(async (req, res) => {
        const where = { isActive: true, isPublic: true };
        const dept = await (0, helpers_1.resolveDepartmentId)(req.query.brand);
        if (dept)
            where.departmentId = { [sequelize_1.Op.in]: await (0, helpers_1.departmentFamily)(dept) };
        const rows = await models_1.ErpModels.DocumentTemplate.findAll({ where, attributes: ['id', 'title', 'category', 'body', 'fileUrl', 'version', 'updatedAt'] });
        return (0, recordRouter_1.ok)(res, rows);
    }));
    const sigLimiter = (0, rateLimit_1.rateLimit)('sign', 30, 10 * 60000);
    r.get('/sign/:token', sigLimiter, (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.SignatureRequest.findOne({ where: { token: req.params.token } });
        if (!row || row.status === 'Cancelled')
            return (0, recordRouter_1.fail)(res, 404, 'This document link is not valid');
        if (row.status === 'Sent' && row.expiresAt && new Date(row.expiresAt) < new Date()) {
            await row.update({ status: 'Expired' });
        }
        if (row.status === 'Sent') {
            await row.update({ status: 'Viewed', viewedAt: new Date() });
            (0, helpers_1.emitChange)(req, 'signature_request', 'updated', row);
        }
        const brand = await (0, outbound_1.brandForDepartment)(row.departmentId);
        return (0, recordRouter_1.ok)(res, {
            code: row.code, title: row.title, category: row.category, recipientName: row.recipientName, body: row.renderedBody, fileUrl: row.fileUrl,
            requiresSignature: row.requiresSignature, status: row.status, signedAt: row.signedAt, signerName: row.signerName,
            signatureImage: ['Signed', 'Acknowledged'].includes(row.status) ? row.signatureImage : null, expiresAt: row.expiresAt, contentHash: row.contentHash,
            brand: { displayName: brand.displayName, logoUrl: brand.logoUrl, primaryColor: brand.primaryColor, address: brand.address, email: brand.email, phone: brand.phone, website: brand.website, tagline: brand.tagline },
        });
    }));
    r.post('/sign/:token', sigLimiter, (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.SignatureRequest.findOne({ where: { token: req.params.token } });
        if (!row || row.status === 'Cancelled')
            return (0, recordRouter_1.fail)(res, 404, 'This document link is not valid');
        if (['Signed', 'Acknowledged', 'Declined'].includes(row.status))
            return (0, recordRouter_1.fail)(res, 409, `This document has already been ${row.status.toLowerCase()}`);
        if (row.status === 'Expired' || (row.expiresAt && new Date(row.expiresAt) < new Date()))
            return (0, recordRouter_1.fail)(res, 410, 'This link has expired — please ask us to resend it');
        if ((0, helpers_1.sha256)(`${row.renderedBody || ''}|${row.fileUrl || ''}`) !== row.contentHash)
            return (0, recordRouter_1.fail)(res, 409, 'This document changed after it was sent. Please ask for a new copy.');
        const ip = (req.headers['x-forwarded-for']?.split(',')[0] || req.ip || '').slice(0, 64);
        const ua = String(req.get('user-agent') || '').slice(0, 500);
        if (req.body.decline) {
            await row.update({ status: 'Declined', declineReason: String(req.body.reason || '').slice(0, 2000), signerIp: ip, signerUserAgent: ua, signedAt: new Date() });
        }
        else {
            const signerName = String(req.body.signerName || '').trim().slice(0, 200);
            if (!req.body.agree)
                return (0, recordRouter_1.fail)(res, 400, 'Please tick the box to confirm you agree');
            if (!signerName)
                return (0, recordRouter_1.fail)(res, 400, 'Please type your full name');
            let signatureImage = null;
            if (row.requiresSignature) {
                signatureImage = String(req.body.signatureImage || '');
                if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(signatureImage) || signatureImage.length > 400000)
                    return (0, recordRouter_1.fail)(res, 400, 'Please draw your signature');
            }
            await row.update({ status: row.requiresSignature ? 'Signed' : 'Acknowledged', signerName, signatureImage, signerIp: ip, signerUserAgent: ua, signedAt: new Date() });
        }
        try {
            if (row.relatedType && row.relatedId)
                await models_1.ErpModels.Activity.create({ entityType: row.relatedType, entityId: row.relatedId, departmentId: row.departmentId, kind: 'Document', content: `Customer ${row.status.toLowerCase()} "${row.title}" (${row.code})`, createdByName: row.recipientName });
        }
        catch { }
        const recipients = [Number(row.sentById)].filter(Boolean);
        await (0, helpers_1.notifyUsers)(req, recipients, { title: `Document ${row.status.toLowerCase()}`, message: `${row.recipientName} ${row.status.toLowerCase()} "${row.title}" (${row.code}).`, type: 'Alert', priority: row.status === 'Declined' ? 'High' : 'Medium', actionUrl: `/documents?request=${row.id}` });
        (0, helpers_1.emitChange)(req, 'signature_request', 'updated', row);
        if (row.status !== 'Declined' && row.recipientEmail) {
            const brand = await (0, outbound_1.brandForDepartment)(row.departmentId);
            (0, outbound_1.sendBrandEmail)(brand, row.recipientEmail, `Your signed copy: ${row.title}`, (0, outbound_1.brandEmailHtml)(brand, 'Thank you', `<p>Dear ${(0, outbound_1.escapeHtml)(row.recipientName)},</p><p>We have received your ${row.requiresSignature ? 'signed' : 'acknowledged'} copy of <strong>${(0, outbound_1.escapeHtml)(row.title)}</strong> (${row.code}) on ${new Date().toUTCString()}.</p><p>You can view or print it any time using the link below.</p>`, { url: `${(process.env.FRONTEND_URL || 'https://www.maxhubng.company').replace(/\/$/, '')}/sign/${row.token}`, label: 'View signed document' })).catch(() => undefined);
        }
        return (0, recordRouter_1.ok)(res, { status: row.status, signedAt: row.signedAt }, row.status === 'Declined' ? 'Response recorded' : 'Thank you — your document has been received');
    }));
    r.get('/track/:code', (0, rateLimit_1.rateLimit)('track', 20, 10 * 60000), (0, recordRouter_1.wrap)(async (req, res) => {
        const code = String(req.params.code).toUpperCase();
        const contact = String(req.query.contact || '').trim().toLowerCase();
        if (contact.length < 4)
            return (0, recordRouter_1.fail)(res, 400, 'Enter the email or the last 4 digits of the phone number used for the order');
        const map = [['ExportOrder', 'export_order', 'stage'], ['TravelCase', 'travel_case', 'stage'], ['CustomOrder', 'custom_order', 'stage'], ['TechProject', 'tech_project', 'stage']];
        for (const [model, entity, field] of map) {
            const row = await models_1.ErpModels[model].findOne({ where: { code } });
            if (!row)
                continue;
            const phone = String(row.customerPhone || row.customerWhatsapp || '').replace(/\D/g, '');
            const matches = (row.customerEmail && row.customerEmail.toLowerCase() === contact) || (/^\d{4,}$/.test(contact) && phone.endsWith(contact));
            if (!matches)
                break;
            const history = await models_1.ErpModels.Activity.findAll({ where: { entityType: entity, entityId: row.id, kind: 'StageChange' }, order: [['createdAt', 'ASC']], attributes: ['content', 'createdAt', 'meta'] });
            const brand = await (0, outbound_1.brandForDepartment)(row.departmentId);
            return (0, recordRouter_1.ok)(res, {
                code: row.code, type: entity, status: row[field], customerName: row.customerName, updatedAt: row.updatedAt,
                destination: row.destinationCountry, trackingNo: row.trackingNo, carrier: row.carrier, expectedDelivery: row.expectedDelivery,
                history: history.map((h) => ({ to: h.meta?.to, at: h.createdAt })), brand: { displayName: brand.displayName, phone: brand.phone, email: brand.email },
            });
        }
        return (0, recordRouter_1.fail)(res, 404, 'We could not find a record with that code and contact');
    }));
    return r;
}
function widgetJs(api, brand, color) {
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
//# sourceMappingURL=public.js.map