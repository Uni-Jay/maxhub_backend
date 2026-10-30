"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncContactsFromClients = syncContactsFromClients;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const Contact_model_1 = require("../models/Contact.model");
const sequelize_2 = require("sequelize");
const router = (0, express_1.Router)();
async function generateContactCode() {
    const last = await Contact_model_1.Contact.findOne({ order: [['id', 'DESC']], paranoid: false });
    const nextNum = last ? Number(last.id) + 1 : 1;
    return `CTK-${String(nextNum).padStart(6, '0')}`;
}
let lastSync = 0;
async function syncContactsFromClients(force = false) {
    if (!force && Date.now() - lastSync < 30000)
        return 0;
    lastSync = Date.now();
    const sequelize = Contact_model_1.Contact.sequelize;
    const hasDeleted = !!Contact_model_1.Contact.getAttributes().deletedAt;
    const notDeleted = hasDeleted ? 'AND ct."deletedAt" IS NULL' : '';
    const [, inserted] = await sequelize.query(`
    INSERT INTO contacts (uuid, "contactCode", "firstName", "lastName", email, phone, company, source, status, address, country, notes, "createdAt", "updatedAt")
    SELECT gen_random_uuid(),
           'CTK-' || COALESCE(NULLIF(c."clientId", ''), 'CL' || c.id::text),
           LEFT(COALESCE(NULLIF(split_part(TRIM(c."fullName"), ' ', 1), ''), 'Client'), 100),
           LEFT(COALESCE(NULLIF(TRIM(substr(TRIM(c."fullName"), length(split_part(TRIM(c."fullName"), ' ', 1)) + 1)), ''), '-'), 100),
           LOWER(TRIM(c.email)), LEFT(COALESCE(c.phone, ''), 20), d.name, 'Direct', 'Active', c.address, c.country,
           'Registered client ' || COALESCE(c."clientId", '#' || c.id::text),
           NOW(), NOW()
    FROM clients c
    LEFT JOIN departments d ON d.id = c."departmentId"
    WHERE c."deletedAt" IS NULL AND COALESCE(TRIM(c.email), '') <> ''
      AND NOT EXISTS (SELECT 1 FROM contacts ct WHERE LOWER(ct.email) = LOWER(TRIM(c.email)) ${notDeleted})
    ON CONFLICT DO NOTHING`, { type: sequelize_2.QueryTypes.INSERT }).catch((e) => { console.error('[CRM] client→contact sync failed:', e?.message); return [null, 0]; });
    await sequelize.query(`
    UPDATE contacts ct SET
      phone = CASE WHEN COALESCE(ct.phone, '') = '' THEN LEFT(COALESCE(c.phone, ''), 20) ELSE ct.phone END,
      country = COALESCE(NULLIF(ct.country, ''), c.country),
      address = COALESCE(NULLIF(ct.address, ''), c.address),
      company = COALESCE(NULLIF(ct.company, ''), d.name),
      "updatedAt" = NOW()
    FROM clients c LEFT JOIN departments d ON d.id = c."departmentId"
    WHERE c."deletedAt" IS NULL AND LOWER(ct.email) = LOWER(TRIM(c.email))
      AND ((COALESCE(ct.phone, '') = '' AND COALESCE(c.phone, '') <> '') OR (COALESCE(ct.country, '') = '' AND c.country IS NOT NULL)
        OR (COALESCE(ct.address, '') = '' AND c.address IS NOT NULL) OR (COALESCE(ct.company, '') = '' AND d.name IS NOT NULL))`).catch(() => undefined);
    return Number(inserted) || 0;
}
router.get('/stats/pipeline', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const counts = await Contact_model_1.Contact.findAll({
        attributes: [
            'status',
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
    });
    const pipeline = {
        Active: 0,
        Inactive: 0,
        Lead: 0,
        Prospect: 0,
        Converted: 0,
        Lost: 0,
    };
    for (const row of counts) {
        pipeline[row.status] = Number(row.count);
    }
    const total = Object.values(pipeline).reduce((a, b) => a + b, 0);
    return ResponseFormatter_1.ResponseFormatter.success(res, { pipeline, total }, 'Pipeline stats retrieved');
}));
router.get('/stats', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    await syncContactsFromClients();
    const counts = await Contact_model_1.Contact.findAll({
        attributes: ['status', [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count']],
        group: ['status'],
        raw: true,
    });
    const byStatus = {};
    for (const row of counts)
        byStatus[row.status] = Number(row.count);
    return ResponseFormatter_1.ResponseFormatter.success(res, {
        total: Object.values(byStatus).reduce((a, b) => a + b, 0),
        active: byStatus.Active ?? 0,
        leads: byStatus.Lead ?? 0,
        prospects: byStatus.Prospect ?? 0,
        converted: byStatus.Converted ?? 0,
    }, 'Contact stats retrieved');
}));
router.post('/sync-clients', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const added = await syncContactsFromClients(true);
    return ResponseFormatter_1.ResponseFormatter.success(res, { added }, added ? `${added} client(s) added to contacts` : 'Contacts are up to date');
}));
router.get('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'), AuthMiddleware_1.AuthMiddleware.pagination, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    await syncContactsFromClients();
    const { page, limit, offset } = req.pagination;
    const { status, source, search, ownerUserId } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (source)
        where.source = source;
    if (ownerUserId)
        where.ownerUserId = ownerUserId;
    if (search) {
        where[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { lastName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { phone: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { company: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { contactCode: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const { count, rows } = await Contact_model_1.Contact.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, page, limit, 'Contacts retrieved');
}));
router.post('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, alternatePhone, company, position, department, accountId, source, leadScore, status, ownerUserId, address, city, state, country, postalCode, industry, noOfEmployees, websiteUrl, notes, lastContactedDate, nextFollowUpDate, } = req.body;
    if (!firstName || !lastName || !email || !phone) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'firstName, lastName, email and phone are required', 400);
    }
    const existing = await Contact_model_1.Contact.findOne({ where: { email } });
    if (existing) {
        return ResponseFormatter_1.ResponseFormatter.conflict(res, `A contact with email '${email}' already exists`);
    }
    const contactCode = await generateContactCode();
    const contact = await Contact_model_1.Contact.create({
        contactCode,
        firstName,
        lastName,
        email,
        phone,
        alternatePhone,
        company,
        position,
        department,
        accountId,
        source: source || 'Direct',
        leadScore: leadScore ?? 0,
        status: status || 'Lead',
        ownerUserId: ownerUserId || req.user.id,
        address,
        city,
        state,
        country,
        postalCode,
        industry,
        noOfEmployees,
        websiteUrl,
        notes,
        lastContactedDate,
        nextFollowUpDate,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, contact, 'Contact created successfully', 201);
}));
router.get('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await Contact_model_1.Contact.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!contact) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Contact not found');
    }
    return ResponseFormatter_1.ResponseFormatter.success(res, contact, 'Contact retrieved');
}));
router.put('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.update.all', 'crm.contact.update.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await Contact_model_1.Contact.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!contact) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Contact not found');
    }
    const { firstName, lastName, email, phone, alternatePhone, company, position, department, accountId, source, leadScore, ownerUserId, address, city, state, country, postalCode, industry, noOfEmployees, websiteUrl, notes, lastContactedDate, nextFollowUpDate, } = req.body;
    if (email && email !== contact.email) {
        const dupe = await Contact_model_1.Contact.findOne({ where: { email } });
        if (dupe) {
            return ResponseFormatter_1.ResponseFormatter.conflict(res, `Email '${email}' is already used by another contact`);
        }
    }
    await contact.update({
        firstName: firstName ?? contact.firstName,
        lastName: lastName ?? contact.lastName,
        email: email ?? contact.email,
        phone: phone ?? contact.phone,
        alternatePhone: alternatePhone ?? contact.alternatePhone,
        company: company ?? contact.company,
        position: position ?? contact.position,
        department: department ?? contact.department,
        accountId: accountId ?? contact.accountId,
        source: source ?? contact.source,
        leadScore: leadScore ?? contact.leadScore,
        ownerUserId: ownerUserId ?? contact.ownerUserId,
        address: address ?? contact.address,
        city: city ?? contact.city,
        state: state ?? contact.state,
        country: country ?? contact.country,
        postalCode: postalCode ?? contact.postalCode,
        industry: industry ?? contact.industry,
        noOfEmployees: noOfEmployees ?? contact.noOfEmployees,
        websiteUrl: websiteUrl ?? contact.websiteUrl,
        notes: notes ?? contact.notes,
        lastContactedDate: lastContactedDate ?? contact.lastContactedDate,
        nextFollowUpDate: nextFollowUpDate ?? contact.nextFollowUpDate,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, contact, 'Contact updated successfully');
}));
router.delete('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const contact = await Contact_model_1.Contact.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!contact) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Contact not found');
    }
    await contact.destroy();
    return ResponseFormatter_1.ResponseFormatter.success(res, null, 'Contact deleted successfully');
}));
router.patch('/:id/status', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.update.all', 'crm.contact.update.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Active', 'Inactive', 'Lead', 'Prospect', 'Converted', 'Lost'];
    if (!status || !validStatuses.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    const contact = await Contact_model_1.Contact.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!contact) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Contact not found');
    }
    await contact.update({ status });
    return ResponseFormatter_1.ResponseFormatter.success(res, contact, `Contact status updated to '${status}'`);
}));
router.post('/:id/follow-up', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.update.all', 'crm.contact.update.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nextFollowUpDate, notes } = req.body;
    if (!nextFollowUpDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'nextFollowUpDate is required', 400);
    }
    const contact = await Contact_model_1.Contact.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!contact) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Contact not found');
    }
    const updatePayload = {
        nextFollowUpDate,
        lastContactedDate: new Date(),
    };
    if (notes !== undefined) {
        updatePayload.notes = contact.notes
            ? `${contact.notes}\n\n[${new Date().toISOString()}] ${notes}`
            : `[${new Date().toISOString()}] ${notes}`;
    }
    await contact.update(updatePayload);
    return ResponseFormatter_1.ResponseFormatter.success(res, contact, 'Follow-up scheduled successfully');
}));
exports.default = router;
//# sourceMappingURL=contact.routes.js.map