import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Invoice } from '@models/Invoice.model';
import { Payment } from '@models/Payment.model';
import { Client } from '@models/Client.model';
import { Department } from '@models/Department.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { getMultiDeptScope } from '@utils/departmentScope';

const router = Router();

// GET /api/invoices — auto-scoped to every department the caller covers
// (primary + secondary StaffDepartment links) unless they hold the _ALL permission.
router.get('/', AuthMiddleware.requirePermission('fin.invoice.read.all', 'acc.invoice.read.all', 'fin.invoice.read.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, accountId, clientId, departmentId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (accountId) where.accountId = accountId;
  if (clientId) where.clientId = clientId;

  const scope = await getMultiDeptScope(req, 'fin.invoice.read.all');
  if (scope.scoped) {
    if (scope.departmentIds.length === 0) return ResponseFormatter.paginated(res, [], 0, Number(page), Number(limit));
    where.departmentId = { [Op.in]: scope.departmentIds };
  } else if (departmentId) {
    where.departmentId = departmentId;
  }

  const { count, rows } = await Invoice.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'clientId'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
    ],
    order: [['invoiceDate', 'DESC']], limit: Number(limit), offset,
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
router.get('/:id', AuthMiddleware.requirePermission('fin.invoice.read.all', 'acc.invoice.read.all', 'fin.invoice.read.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [
      { model: Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'phone', 'clientId'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
    ],
  });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);

  const scope = await getMultiDeptScope(req, 'fin.invoice.read.all');
  if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only view invoices for your own departments', 403);
  }

  const payments = await Payment.findAll({ where: { invoiceId: (invoice as any).id }, order: [['paymentDate', 'DESC']] });
  ResponseFormatter.success(res, { ...invoice.toJSON(), payments });
}));

// POST /api/invoices
router.post('/', AuthMiddleware.requirePermission('fin.invoice.create.all', 'acc.invoice.create.all', 'fin.invoice.create.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { accountId, clientId, invoiceDate, dueDate, subtotal, discount, tax, total, currency, description, orderId, items } = req.body;
  if (!clientId && !accountId) return ResponseFormatter.error(res, 'clientId is required', 400);
  if (!dueDate || subtotal === undefined || total === undefined) {
    return ResponseFormatter.error(res, 'dueDate, subtotal, total are required', 400);
  }

  let departmentId: number | undefined;
  if (clientId) {
    const client = await Client.findByPk(clientId, { attributes: ['id', 'departmentId'] });
    if (!client) return ResponseFormatter.error(res, 'Client not found', 404);
    departmentId = client.departmentId ? Number(client.departmentId) : undefined;

    const scope = await getMultiDeptScope(req, 'fin.invoice.create.all');
    if (scope.scoped) {
      if (!departmentId || !scope.departmentIds.includes(departmentId)) {
        return ResponseFormatter.error(res, 'You can only invoice clients in your own departments', 403);
      }
    }
  }

  const count = await Invoice.count();
  const invoiceCode = `INV-${String(count + 1).padStart(6, '0')}`;

  const invoice = await Invoice.create({
    uuid: uuidv4(), invoiceCode, accountId, clientId, departmentId, orderId, items,
    invoiceDate: invoiceDate || new Date(),
    dueDate, subtotal, discount: discount || 0, tax: tax || 0, total,
    currency: currency || 'NGN', description,
    status: 'Draft', createdById: (req as any).user.id,
  } as any);
  ResponseFormatter.success(res, invoice, 'Invoice created', 201);
}));

// PUT /api/invoices/:id
router.put('/:id', AuthMiddleware.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all', 'fin.invoice.update.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);
  if ((invoice as any).status !== 'Draft') return ResponseFormatter.error(res, 'Only Draft invoices can be edited', 400);

  const scope = await getMultiDeptScope(req, 'fin.invoice.update.all');
  if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
  }

  const allowed = ['invoiceDate', 'dueDate', 'subtotal', 'discount', 'tax', 'total', 'currency', 'description', 'items'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await invoice.update(updates);
  ResponseFormatter.success(res, invoice, 'Invoice updated');
}));

// PATCH /api/invoices/:id/status
router.patch('/:id/status', AuthMiddleware.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all', 'fin.invoice.update.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);

  const scope = await getMultiDeptScope(req, 'fin.invoice.update.all');
  if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
  }

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
router.delete('/:id', AuthMiddleware.requirePermission('fin.invoice.delete.all', 'acc.invoice.delete.all', 'fin.invoice.delete.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);
  if ((invoice as any).status !== 'Draft') return ResponseFormatter.error(res, 'Only Draft invoices can be deleted', 400);

  const scope = await getMultiDeptScope(req, 'fin.invoice.delete.all');
  if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
  }

  await invoice.destroy();
  ResponseFormatter.success(res, null, 'Invoice deleted');
}));

// POST /api/invoices/:id/payments
router.post('/:id/payments', AuthMiddleware.requirePermission('fin.invoice.update.all', 'acc.invoice.update.all', 'fin.invoice.update.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const invoice = await Invoice.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!invoice) return ResponseFormatter.error(res, 'Invoice not found', 404);
  if (['Paid', 'Cancelled'].includes((invoice as any).status)) {
    return ResponseFormatter.error(res, 'Invoice is already paid or cancelled', 400);
  }

  const scope = await getMultiDeptScope(req, 'fin.invoice.update.all');
  if (scope.scoped && (!invoice.departmentId || !scope.departmentIds.includes(Number(invoice.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only manage invoices for your own departments', 403);
  }

  const { amount, paymentMethod, paymentDate, reference } = req.body;
  if (!amount || !paymentMethod) return ResponseFormatter.error(res, 'amount and paymentMethod are required', 400);

  const paymentCode = `PAY-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
  const payment = await Payment.create({
    uuid: uuidv4(), paymentCode, invoiceId: (invoice as any).id, amount,
    currency: (invoice as any).currency ?? 'NGN',
    paymentMethod, paymentDate: paymentDate || new Date(),
    referenceNumber: reference, status: 'Processed', processedBy: (req as any).user.id, processedDate: new Date(),
  } as any);

  const allPayments = await Payment.findAll({ where: { invoiceId: (invoice as any).id, status: 'Processed' } });
  const totalPaid = allPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const invoiceTotal = Number((invoice as any).total);

  let newStatus = (invoice as any).status;
  if (totalPaid >= invoiceTotal) newStatus = 'Paid';
  else if (totalPaid > 0) newStatus = 'PartiallyPaid';

  await invoice.update({ status: newStatus });
  ResponseFormatter.success(res, { payment, updatedStatus: newStatus }, 'Payment recorded', 201);
}));

export default router;
