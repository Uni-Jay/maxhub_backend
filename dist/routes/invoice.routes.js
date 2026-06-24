"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Invoice_model_1 = require("../models/Invoice.model");
const Payment_model_1 = require("../models/Payment.model");
const Client_model_1 = require("../models/Client.model");
const Department_model_1 = require("../models/Department.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const departmentScope_1 = require("../utils/departmentScope");
const router = (0, express_1.Router)();
router.get('/', AuthMiddleware_1.default.requirePermission('fin.invoice.read.all', 'acc.invoice.read.all', 'fin.invoice.read.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, accountId, clientId, departmentId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (accountId)
        where.accountId = accountId;
    if (clientId)
        where.clientId = clientId;
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'fin.invoice.read.all');
    if (scope.scoped) {
        if (scope.departmentIds.length === 0)
            return ResponseFormatter_1.ResponseFormatter.paginated(res, [], 0, Number(page), Number(limit));
        where.departmentId = { [sequelize_1.Op.in]: scope.departmentIds };
    }
    else if (departmentId) {
        where.departmentId = departmentId;
    }
    const { count, rows } = await Invoice_model_1.Invoice.findAndCountAll({
        where,
        include: [
            { model: Client_model_1.Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'clientId'] },
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
        ],
        order: [['invoiceDate', 'DESC']], limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/stats/overview', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, draft, issued, paid, overdue] = await Promise.all([
        Invoice_model_1.Invoice.count(),
        Invoice_model_1.Invoice.count({ where: { status: 'Draft' } }),
        Invoice_model_1.Invoice.count({ where: { status: 'Issued' } }),
        Invoice_model_1.Invoice.count({ where: { status: 'Paid' } }),
        Invoice_model_1.Invoice.count({ where: { status: 'Overdue' } }),
    ]);
    const paidInvoices = await Invoice_model_1.Invoice.findAll({ where: { status: 'Paid' }, attributes: ['total'] });
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, draft, issued, paid, overdue, totalRevenue });
}));
router.get('/:id', AuthMiddleware_1.default.requirePermission('fin.invoice.read.all', 'acc.invoice.read.all', 'fin.invoice.read.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [
            { model: Client_model_1.Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'phone', 'clientId'] },
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
        ],
    });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'fin.invoice.read.all');
    if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only view invoices for your own departments', 403);
    }
    const payments = await Payment_model_1.Payment.findAll({ where: { invoiceId: invoice.id }, order: [['paymentDate', 'DESC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...invoice.toJSON(), payments });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('fin.invoice.create.all', 'acc.invoice.create.all', 'fin.invoice.create.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { accountId, clientId, invoiceDate, dueDate, subtotal, discount, tax, total, currency, description, orderId, items } = req.body;
    if (!clientId && !accountId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'clientId is required', 400);
    if (!dueDate || subtotal === undefined || total === undefined) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'dueDate, subtotal, total are required', 400);
    }
    let departmentId;
    if (clientId) {
        const client = await Client_model_1.Client.findByPk(clientId, { attributes: ['id', 'departmentId'] });
        if (!client)
            return ResponseFormatter_1.ResponseFormatter.error(res, 'Client not found', 404);
        departmentId = client.departmentId ? Number(client.departmentId) : undefined;
        const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'fin.invoice.create.all');
        if (scope.scoped) {
            if (!departmentId || !scope.departmentIds.includes(departmentId)) {
                return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only invoice clients in your own departments', 403);
            }
        }
    }
    const invoice = await Invoice_model_1.Invoice.create({
        uuid: (0, uuid_1.v4)(), invoiceCode: '', accountId, clientId, departmentId, orderId, items,
        invoiceDate: invoiceDate || new Date(),
        dueDate, subtotal, discount: discount || 0, tax: tax || 0, total,
        currency: currency || 'NGN', description,
        status: 'Draft', createdById: req.user.id,
    });
    await invoice.update({ invoiceCode: `INV-${String(invoice.id).padStart(6, '0')}` });
    ResponseFormatter_1.ResponseFormatter.success(res, invoice, 'Invoice created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all', 'fin.invoice.update.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    if (invoice.status !== 'Draft')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft invoices can be edited', 400);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'fin.invoice.update.all');
    if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
    }
    const allowed = ['invoiceDate', 'dueDate', 'subtotal', 'discount', 'tax', 'total', 'currency', 'description', 'items'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await invoice.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, invoice, 'Invoice updated');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all', 'fin.invoice.update.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'fin.invoice.update.all');
    if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
    }
    const { status } = req.body;
    const current = invoice.status;
    const validTransitions = {
        Draft: ['Issued', 'Cancelled'],
        Issued: ['PartiallyPaid', 'Cancelled', 'Overdue'],
        PartiallyPaid: ['Paid', 'Overdue'],
        Paid: [],
        Overdue: ['Paid', 'Cancelled'],
        Cancelled: [],
    };
    if (!validTransitions[current]?.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
    }
    await invoice.update({ status });
    ResponseFormatter_1.ResponseFormatter.success(res, invoice, 'Status updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('fin.invoice.delete.all', 'acc.invoice.delete.all', 'fin.invoice.delete.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    if (invoice.status !== 'Draft')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft invoices can be deleted', 400);
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'fin.invoice.delete.all');
    if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
    }
    await invoice.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Invoice deleted');
}));
router.post('/:id/payments', AuthMiddleware_1.default.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all', 'fin.invoice.update.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    if (['Paid', 'Cancelled'].includes(invoice.status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice is already paid or cancelled', 400);
    }
    const scope = await (0, departmentScope_1.getMultiDeptScope)(req, 'fin.invoice.update.all');
    if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
    }
    const { amount, paymentMethod, paymentDate, reference } = req.body;
    if (!amount || !paymentMethod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'amount and paymentMethod are required', 400);
    const paymentCode = `PAY-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
    const payment = await Payment_model_1.Payment.create({
        uuid: (0, uuid_1.v4)(), paymentCode, invoiceId: invoice.id, amount,
        currency: invoice.currency ?? 'NGN',
        paymentMethod, paymentDate: paymentDate || new Date(),
        referenceNumber: reference, status: 'Processed', processedBy: req.user.id, processedDate: new Date(),
    });
    const allPayments = await Payment_model_1.Payment.findAll({ where: { invoiceId: invoice.id, status: 'Processed' } });
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const invoiceTotal = Number(invoice.total);
    let newStatus = invoice.status;
    if (totalPaid >= invoiceTotal)
        newStatus = 'Paid';
    else if (totalPaid > 0)
        newStatus = 'PartiallyPaid';
    await invoice.update({ status: newStatus });
    ResponseFormatter_1.ResponseFormatter.success(res, { payment, updatedStatus: newStatus }, 'Payment recorded', 201);
}));
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map