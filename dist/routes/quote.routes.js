"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Quote_model_1 = require("../models/Quote.model");
const Client_model_1 = require("../models/Client.model");
const Department_model_1 = require("../models/Department.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const departmentScope_1 = require("../utils/departmentScope");
const notification_email_service_1 = require("../services/email/notification-email.service");
const router = (0, express_1.Router)();
router.get('/', AuthMiddleware_1.default.requirePermission('crm.quote.read.all', 'crm.quote.read.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, clientId, departmentId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (clientId)
        where.clientId = clientId;
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'crm.quote.read.all');
    if (scope.scoped) {
        if (scope.departmentIds.length === 0)
            return ResponseFormatter_1.ResponseFormatter.paginated(res, [], 0, Number(page), Number(limit));
        where.departmentId = { [sequelize_1.Op.in]: scope.departmentIds };
    }
    else if (departmentId) {
        where.departmentId = departmentId;
    }
    const { count, rows } = await Quote_model_1.Quote.findAndCountAll({
        where,
        include: [
            { model: Client_model_1.Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'clientId'] },
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
        ],
        order: [['quoteDate', 'DESC']], limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/:id', AuthMiddleware_1.default.requirePermission('crm.quote.read.all', 'crm.quote.read.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const quote = await Quote_model_1.Quote.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [
            { model: Client_model_1.Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'phone', 'clientId'] },
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
        ],
    });
    if (!quote)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Proposal not found', 404);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'crm.quote.read.all');
    if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only view proposals for your own departments', 403);
    }
    ResponseFormatter_1.ResponseFormatter.success(res, quote);
}));
router.post('/', AuthMiddleware_1.default.requirePermission('crm.quote.create.all', 'crm.quote.create.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { clientId, title, scopeOfWork, termsAndConditions, items, subtotal, discount, tax, total, currency, validUntil, opportunityId, contactId, description } = req.body;
    if (!clientId || !title || !validUntil || subtotal === undefined || total === undefined) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'clientId, title, validUntil, subtotal, total are required', 400);
    }
    const client = await Client_model_1.Client.findByPk(clientId, { attributes: ['id', 'departmentId'] });
    if (!client)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Client not found', 404);
    const departmentId = client.departmentId ? Number(client.departmentId) : undefined;
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'crm.quote.create.all');
    if (scope.scoped) {
        if (!departmentId || !scope.departmentIds.includes(departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only draft proposals for clients in your own departments', 403);
        }
    }
    const count = await Quote_model_1.Quote.count();
    const quoteCode = `PROP-${String(count + 1).padStart(6, '0')}`;
    const quote = await Quote_model_1.Quote.create({
        uuid: (0, uuid_1.v4)(), quoteCode, clientId, departmentId, opportunityId, contactId,
        title, scopeOfWork, termsAndConditions, items, description,
        quoteDate: new Date(), validUntil,
        subtotal, discount: discount || 0, tax: tax || 0, total,
        currency: currency || 'NGN', status: 'Draft', createdById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, quote, 'Proposal created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('crm.quote.update.all', 'crm.quote.update.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const quote = await Quote_model_1.Quote.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!quote)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Proposal not found', 404);
    if (quote.status !== 'Draft')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft proposals can be edited', 400);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'crm.quote.update.all');
    if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage proposals for your own departments', 403);
    }
    const allowed = ['title', 'scopeOfWork', 'termsAndConditions', 'items', 'subtotal', 'discount', 'tax', 'total', 'currency', 'validUntil', 'description'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await quote.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, quote, 'Proposal updated');
}));
router.post('/:id/send', AuthMiddleware_1.default.requirePermission('crm.quote.send.all', 'crm.quote.send.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const quote = await Quote_model_1.Quote.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [{ model: Client_model_1.Client, as: 'client', attributes: ['id', 'fullName', 'email'] }],
    });
    if (!quote)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Proposal not found', 404);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'crm.quote.send.all');
    if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only send proposals for your own departments', 403);
    }
    const client = quote.client;
    if (!client?.email)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'This client has no email on file', 400);
    const sent = await (0, notification_email_service_1.sendProposalEmail)({
        to: client.email, clientName: client.fullName, proposalCode: quote.quoteCode,
        title: quote.title || 'Proposal', scopeOfWork: quote.scopeOfWork, termsAndConditions: quote.termsAndConditions,
        items: quote.items || [], subtotal: Number(quote.subtotal), discount: Number(quote.discount),
        tax: Number(quote.tax), total: Number(quote.total), currency: quote.currency, validUntil: quote.validUntil,
        senderName: req.user.name,
    });
    if (!sent)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Failed to send proposal email', 502);
    await quote.update({ status: 'Sent', sentAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, quote, 'Proposal sent to client');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('crm.quote.update.all', 'crm.quote.update.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const quote = await Quote_model_1.Quote.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!quote)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Proposal not found', 404);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'crm.quote.update.all');
    if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage proposals for your own departments', 403);
    }
    const { status } = req.body;
    const current = quote.status;
    const validTransitions = {
        Draft: ['Sent'],
        Sent: ['Accepted', 'Rejected', 'Expired'],
        Accepted: [],
        Rejected: [],
        Expired: [],
    };
    if (!validTransitions[current]?.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
    }
    await quote.update({ status, respondedAt: ['Accepted', 'Rejected'].includes(status) ? new Date() : quote.respondedAt });
    ResponseFormatter_1.ResponseFormatter.success(res, quote, 'Status updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('crm.quote.delete.all', 'crm.quote.delete.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const quote = await Quote_model_1.Quote.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!quote)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Proposal not found', 404);
    if (quote.status !== 'Draft')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft proposals can be deleted', 400);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'crm.quote.delete.all');
    if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage proposals for your own departments', 403);
    }
    await quote.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Proposal deleted');
}));
exports.default = router;
//# sourceMappingURL=quote.routes.js.map