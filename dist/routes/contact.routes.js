"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const Contact_model_1 = require("../models/Contact.model");
const router = (0, express_1.Router)();
async function generateContactCode() {
    const last = await Contact_model_1.Contact.findOne({ order: [['id', 'DESC']], paranoid: false });
    const nextNum = last ? Number(last.id) + 1 : 1;
    return `CTK-${String(nextNum).padStart(6, '0')}`;
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
router.get('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'), AuthMiddleware_1.AuthMiddleware.pagination, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
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
            { firstName: { [sequelize_1.Op.like]: `%${search}%` } },
            { lastName: { [sequelize_1.Op.like]: `%${search}%` } },
            { email: { [sequelize_1.Op.like]: `%${search}%` } },
            { phone: { [sequelize_1.Op.like]: `%${search}%` } },
            { company: { [sequelize_1.Op.like]: `%${search}%` } },
            { contactCode: { [sequelize_1.Op.like]: `%${search}%` } },
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