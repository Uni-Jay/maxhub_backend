import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Quote } from '@models/Quote.model';
import { Client } from '@models/Client.model';
import { Department } from '@models/Department.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { getMultiDeptScope } from '@utils/departmentScope';
import { sendProposalEmail } from '@services/email/notification-email.service';

const router = Router();

// GET /api/quotes — proposals, auto-scoped to every department the caller covers
router.get('/', AuthMiddleware.requirePermission('crm.quote.read.all', 'crm.quote.read.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, status, clientId, departmentId } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;

  const scope = await getMultiDeptScope(req, 'crm.quote.read.all');
  if (scope.scoped) {
    if (scope.departmentIds.length === 0) return ResponseFormatter.paginated(res, [], 0, Number(page), Number(limit));
    where.departmentId = { [Op.in]: scope.departmentIds };
  } else if (departmentId) {
    where.departmentId = departmentId;
  }

  const { count, rows } = await Quote.findAndCountAll({
    where,
    include: [
      { model: Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'clientId'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
    ],
    order: [['quoteDate', 'DESC']], limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/quotes/:id
router.get('/:id', AuthMiddleware.requirePermission('crm.quote.read.all', 'crm.quote.read.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const quote = await Quote.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [
      { model: Client, as: 'client', attributes: ['id', 'uuid', 'fullName', 'email', 'phone', 'clientId'] },
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
    ],
  });
  if (!quote) return ResponseFormatter.error(res, 'Proposal not found', 404);

  const scope = await getMultiDeptScope(req, 'crm.quote.read.all');
  if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only view proposals for your own departments', 403);
  }

  ResponseFormatter.success(res, quote);
}));

// POST /api/quotes — draft a new proposal
router.post('/', AuthMiddleware.requirePermission('crm.quote.create.all', 'crm.quote.create.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { clientId, title, scopeOfWork, termsAndConditions, items, subtotal, discount, tax, total, currency, validUntil, opportunityId, contactId, description } = req.body;
  if (!clientId || !title || !validUntil || subtotal === undefined || total === undefined) {
    return ResponseFormatter.error(res, 'clientId, title, validUntil, subtotal, total are required', 400);
  }

  const client = await Client.findByPk(clientId, { attributes: ['id', 'departmentId'] });
  if (!client) return ResponseFormatter.error(res, 'Client not found', 404);
  const departmentId = client.departmentId ? Number(client.departmentId) : undefined;

  const scope = await getMultiDeptScope(req, 'crm.quote.create.all');
  if (scope.scoped) {
    if (!departmentId || !scope.departmentIds.includes(departmentId)) {
      return ResponseFormatter.error(res, 'You can only draft proposals for clients in your own departments', 403);
    }
  }

  const count = await Quote.count();
  const quoteCode = `PROP-${String(count + 1).padStart(6, '0')}`;

  const quote = await Quote.create({
    uuid: uuidv4(), quoteCode, clientId, departmentId, opportunityId, contactId,
    title, scopeOfWork, termsAndConditions, items, description,
    quoteDate: new Date(), validUntil,
    subtotal, discount: discount || 0, tax: tax || 0, total,
    currency: currency || 'NGN', status: 'Draft', createdById: (req as any).user.id,
  } as any);

  ResponseFormatter.success(res, quote, 'Proposal created', 201);
}));

// PUT /api/quotes/:id
router.put('/:id', AuthMiddleware.requirePermission('crm.quote.update.all', 'crm.quote.update.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const quote = await Quote.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!quote) return ResponseFormatter.error(res, 'Proposal not found', 404);
  if (quote.status !== 'Draft') return ResponseFormatter.error(res, 'Only Draft proposals can be edited', 400);

  const scope = await getMultiDeptScope(req, 'crm.quote.update.all');
  if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only manage proposals for your own departments', 403);
  }

  const allowed = ['title', 'scopeOfWork', 'termsAndConditions', 'items', 'subtotal', 'discount', 'tax', 'total', 'currency', 'validUntil', 'description'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await quote.update(updates);
  ResponseFormatter.success(res, quote, 'Proposal updated');
}));

// POST /api/quotes/:id/send — email the proposal to the client
router.post('/:id/send', AuthMiddleware.requirePermission('crm.quote.send.all', 'crm.quote.send.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const quote = await Quote.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
    include: [{ model: Client, as: 'client', attributes: ['id', 'fullName', 'email'] }],
  });
  if (!quote) return ResponseFormatter.error(res, 'Proposal not found', 404);

  const scope = await getMultiDeptScope(req, 'crm.quote.send.all');
  if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only send proposals for your own departments', 403);
  }

  const client = (quote as any).client;
  if (!client?.email) return ResponseFormatter.error(res, 'This client has no email on file', 400);

  const sent = await sendProposalEmail({
    to: client.email, clientName: client.fullName, proposalCode: quote.quoteCode,
    title: quote.title || 'Proposal', scopeOfWork: quote.scopeOfWork, termsAndConditions: quote.termsAndConditions,
    items: (quote.items as any) || [], subtotal: Number(quote.subtotal), discount: Number(quote.discount),
    tax: Number(quote.tax), total: Number(quote.total), currency: quote.currency, validUntil: quote.validUntil,
    senderName: (req as any).user.name,
  });
  if (!sent) return ResponseFormatter.error(res, 'Failed to send proposal email', 502);

  await quote.update({ status: 'Sent', sentAt: new Date() });
  ResponseFormatter.success(res, quote, 'Proposal sent to client');
}));

// PATCH /api/quotes/:id/status — record the client's decision
router.patch('/:id/status', AuthMiddleware.requirePermission('crm.quote.update.all', 'crm.quote.update.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const quote = await Quote.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!quote) return ResponseFormatter.error(res, 'Proposal not found', 404);

  const scope = await getMultiDeptScope(req, 'crm.quote.update.all');
  if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only manage proposals for your own departments', 403);
  }

  const { status } = req.body;
  const current = quote.status;
  const validTransitions: Record<string, string[]> = {
    Draft: ['Sent'],
    Sent: ['Accepted', 'Rejected', 'Expired'],
    Accepted: [],
    Rejected: [],
    Expired: [],
  };
  if (!validTransitions[current]?.includes(status)) {
    return ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
  }

  await quote.update({ status, respondedAt: ['Accepted', 'Rejected'].includes(status) ? new Date() : quote.respondedAt });
  ResponseFormatter.success(res, quote, 'Status updated');
}));

// DELETE /api/quotes/:id
router.delete('/:id', AuthMiddleware.requirePermission('crm.quote.delete.all', 'crm.quote.delete.own_department'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const quote = await Quote.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!quote) return ResponseFormatter.error(res, 'Proposal not found', 404);
  if (quote.status !== 'Draft') return ResponseFormatter.error(res, 'Only Draft proposals can be deleted', 400);

  const scope = await getMultiDeptScope(req, 'crm.quote.delete.all');
  if (scope.scoped && (!quote.departmentId || !scope.departmentIds.includes(Number(quote.departmentId)))) {
    return ResponseFormatter.error(res, 'You can only manage proposals for your own departments', 403);
  }

  await quote.destroy();
  ResponseFormatter.success(res, null, 'Proposal deleted');
}));

export default router;
