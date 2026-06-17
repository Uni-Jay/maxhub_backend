import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Invoice } from '@models/Invoice.model';
import { Payment } from '@models/Payment.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/invoices
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, accountId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (accountId) where.accountId = accountId;

  const { count, rows } = await Invoice.findAndCountAll({
    where, order: [['invoiceDate', 'DESC']], limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/invoices/stats/overview
router.get('/stats/overview', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, draft, issued, paid, overdue] = await Promise.all([
    Invoice.count(),
    Invoice.count({ where: { status: 'Draft' } }),
    Invoice.count({ where: { status: 'Issued' } }),
    Invoice.count({ where: { status: 'Paid' } }),
    Invoice.count({ where: { status: 'Overdue' } }),
  ]);

  const paidInvoices = await Invoice.findAll({ where: { status: 'Paid' }, attributes: ['total'] });
  const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

  ResponseFormatter.success(res, { total, draft, issued, paid, overdue, totalRevenue });
}));

// GET /api/invoices/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
  });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);

  const payments = await Payment.findAll({ where: { invoiceId: (invoice as any).id }, order: [['paymentDate', 'DESC']] });
  ResponseFormatter.success(res, { ...invoice.toJSON(), payments });
}));

// POST /api/invoices
router.post('/', AuthMiddleware.requirePermission('fin.invoice.create.all', 'acc.invoice.create.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { accountId, invoiceDate, dueDate, subtotal, discount, tax, total, currency, description, orderId } = req.body;
  if (!accountId || !dueDate || subtotal === undefined || total === undefined) {
    return ResponseFormatter.error(res, 'accountId, dueDate, subtotal, total are required', 400);
  }

  const count = await Invoice.count();
  const invoiceCode = `INV-${String(count + 1).padStart(6, '0')}`;

  const invoice = await Invoice.create({
    uuid: uuidv4(), invoiceCode, accountId, orderId,
    invoiceDate: invoiceDate || new Date(),
    dueDate, subtotal, discount: discount || 0, tax: tax || 0, total,
    currency: currency || 'NGN', description,
    status: 'Draft', createdById: (req as any).user.id,
  } as any);
  ResponseFormatter.success(res, invoice, 'Invoice created', 201);
}));

// PUT /api/invoices/:id
router.put('/:id', AuthMiddleware.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);
  if ((invoice as any).status !== 'Draft') return ResponseFormatter.error(res, 'Only Draft invoices can be edited', 400);

  const allowed = ['invoiceDate', 'dueDate', 'subtotal', 'discount', 'tax', 'total', 'currency', 'description'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await invoice.update(updates);
  ResponseFormatter.success(res, invoice, 'Invoice updated');
}));

// PATCH /api/invoices/:id/status
router.patch('/:id/status', AuthMiddleware.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);

  const { status } = req.body;
  const current = (invoice as any).status;
  const validTransitions: Record<string, string[]> = {
    Draft: ['Issued', 'Cancelled'],
    Issued: ['PartiallyPaid', 'Cancelled', 'Overdue'],
    PartiallyPaid: ['Paid', 'Overdue'],
    Paid: [],
    Overdue: ['Paid', 'Cancelled'],
    Cancelled: [],
  };

  if (!validTransitions[current]?.includes(status)) {
    return ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
  }

  await invoice.update({ status });
  ResponseFormatter.success(res, invoice, 'Status updated');
}));

// DELETE /api/invoices/:id
router.delete('/:id', AuthMiddleware.requirePermission('fin.invoice.delete.all', 'acc.invoice.delete.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);
  if ((invoice as any).status !== 'Draft') return ResponseFormatter.error(res, 'Only Draft invoices can be deleted', 400);
  await invoice.destroy();
  ResponseFormatter.success(res, null, 'Invoice deleted');
}));

// POST /api/invoices/:id/payments
router.post('/:id/payments', AuthMiddleware.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);
  if (['Paid', 'Cancelled'].includes((invoice as any).status)) {
    return ResponseFormatter.error(res, 'Invoice is already paid or cancelled', 400);
  }

  const { amount, paymentMethod, paymentDate, reference } = req.body;
  if (!amount || !paymentMethod) return ResponseFormatter.error(res, 'amount and paymentMethod are required', 400);

  const payment = await Payment.create({
    uuid: uuidv4(), invoiceId: (invoice as any).id, amount,
    paymentMethod, paymentDate: paymentDate || new Date(),
    reference, status: 'Completed', createdById: (req as any).user.id,
  } as any);

  const allPayments = await Payment.findAll({ where: { invoiceId: (invoice as any).id, status: 'Completed' } });
  const totalPaid = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const invoiceTotal = Number((invoice as any).total);

  let newStatus = (invoice as any).status;
  if (totalPaid >= invoiceTotal) newStatus = 'Paid';
  else if (totalPaid > 0) newStatus = 'PartiallyPaid';

  await invoice.update({ status: newStatus });
  ResponseFormatter.success(res, { payment, updatedStatus: newStatus }, 'Payment recorded', 201);
}));

export default router;
