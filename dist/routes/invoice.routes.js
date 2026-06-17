"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Invoice_model_1 = require("../models/Invoice.model");
const Payment_model_1 = require("../models/Payment.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status, accountId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status)
        where.status = status;
    if (accountId)
        where.accountId = accountId;
    const { count, rows } = await Invoice_model_1.Invoice.findAndCountAll({
        where, order: [['invoiceDate', 'DESC']], limit: Number(limit), offset,
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
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    const payments = await Payment_model_1.Payment.findAll({ where: { invoiceId: invoice.id }, order: [['paymentDate', 'DESC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...invoice.toJSON(), payments });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('fin.invoice.create.all', 'acc.invoice.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { accountId, invoiceDate, dueDate, subtotal, discount, tax, total, currency, description, orderId } = req.body;
    if (!accountId || !dueDate || subtotal === undefined || total === undefined) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'accountId, dueDate, subtotal, total are required', 400);
    }
    const count = await Invoice_model_1.Invoice.count();
    const invoiceCode = `INV-${String(count + 1).padStart(6, '0')}`;
    const invoice = await Invoice_model_1.Invoice.create({
        uuid: (0, uuid_1.v4)(), invoiceCode, accountId, orderId,
        invoiceDate: invoiceDate || new Date(),
        dueDate, subtotal, discount: discount || 0, tax: tax || 0, total,
        currency: currency || 'NGN', description,
        status: 'Draft', createdById: req.user.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, invoice, 'Invoice created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    if (invoice.status !== 'Draft')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft invoices can be edited', 400);
    const allowed = ['invoiceDate', 'dueDate', 'subtotal', 'discount', 'tax', 'total', 'currency', 'description'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await invoice.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, invoice, 'Invoice updated');
}));
router.patch('/:id/status', AuthMiddleware_1.default.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
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
router.delete('/:id', AuthMiddleware_1.default.requirePermission('fin.invoice.delete.all', 'acc.invoice.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    if (invoice.status !== 'Draft')
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Only Draft invoices can be deleted', 400);
    await invoice.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Invoice deleted');
}));
router.post('/:id/payments', AuthMiddleware_1.default.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const invoice = await Invoice_model_1.Invoice.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!invoice)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice not found', 404);
    if (['Paid', 'Cancelled'].includes(invoice.status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Invoice is already paid or cancelled', 400);
    }
    const { amount, paymentMethod, paymentDate, reference } = req.body;
    if (!amount || !paymentMethod)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'amount and paymentMethod are required', 400);
    const payment = await Payment_model_1.Payment.create({
        uuid: (0, uuid_1.v4)(), invoiceId: invoice.id, amount,
        paymentMethod, paymentDate: paymentDate || new Date(),
        reference, status: 'Completed', createdById: req.user.id,
    });
    const allPayments = await Payment_model_1.Payment.findAll({ where: { invoiceId: invoice.id, status: 'Completed' } });
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