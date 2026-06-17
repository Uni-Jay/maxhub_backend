// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { VisaApplicant } from '@models/VisaApplicant.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// Map frontend service types → backend visaType enum
function toVisaType(serviceType: string): string {
  const map: Record<string, string> = {
    'Overseas Study': 'Student',
    'Work Visa / Job Travel': 'Work',
    'Business Travel': 'Business',
    'Immigration Consulting': 'Residence',
  };
  return map[serviceType] ?? 'Tourist';
}

// Map frontend AppStatus → backend status enum
function toBackendStatus(s: string): string {
  const map: Record<string, string> = {
    'Pending': 'New',
    'Processing': 'In Progress',
    'Awaiting Docs': 'Document Review',
    'Approved': 'Approved',
    'Completed': 'Approved',
    'Rejected': 'Rejected',
    'On Hold': 'Cancelled',
  };
  return map[s] ?? 'New';
}

// Map backend record → frontend Application shape
function toFrontend(a: any): object {
  const statusMap: Record<string, string> = {
    'New': 'Pending',
    'In Progress': 'Processing',
    'Document Review': 'Awaiting Docs',
    'Interview': 'Processing',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Cancelled': 'On Hold',
  };
  const notesRaw: string = a.notes ?? '';
  // notes format: "serviceType:VALUE;processingDate:VALUE;expectedCompletion:VALUE;actualCompletion:VALUE;assignedTo:VALUE;||USERNOTES"
  const metaMatch = notesRaw.match(/^__META__(.+?)\|\|/s);
  let meta: Record<string, string> = {};
  let userNotes = notesRaw;
  if (metaMatch) {
    meta = Object.fromEntries(metaMatch[1].split(';').filter(Boolean).map((p: string) => p.split(':')));
    userNotes = notesRaw.slice(metaMatch[0].length);
  }

  return {
    id: Number(a.id),
    clientName: `${a.firstName} ${a.lastName}`.trim(),
    clientPhone: a.phone,
    clientEmail: a.email,
    serviceType: meta.serviceType || a.visaType || 'Visa Processing',
    destination: a.destinationCountry,
    status: statusMap[a.status] ?? 'Pending',
    assignedTo: meta.assignedTo || '',
    applicationDate: a.applicationDate?.toISOString?.()?.slice(0, 10) ?? '',
    processingDate: meta.processingDate || '',
    expectedCompletion: a.expectedDecisionDate?.toISOString?.()?.slice(0, 10) ?? meta.expectedCompletion ?? '',
    actualCompletion: meta.actualCompletion || '',
    notes: userNotes.trim(),
  };
}

// Build notes field with embedded metadata
function buildNotes(payload: any, existingNotes = ''): string {
  const meta: Record<string, string> = {
    serviceType: payload.serviceType ?? '',
    processingDate: payload.processingDate ?? '',
    expectedCompletion: payload.expectedCompletion ?? '',
    actualCompletion: payload.actualCompletion ?? '',
    assignedTo: payload.assignedTo ?? '',
  };
  const metaStr = Object.entries(meta).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(';');
  return metaStr ? `__META__${metaStr}||${payload.notes ?? ''}` : (payload.notes ?? existingNotes);
}

// GET /api/visamax/applications
router.get('/applications', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status, visaType, priority, search, page = 1, limit = 100 } = req.query;
  const where: any = {};

  if (status) where.status = toBackendStatus(status as string);
  if (visaType) where.visaType = toVisaType(visaType as string);
  if (priority) where.priorityLevel = priority;
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { passportNumber: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { destinationCountry: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await VisaApplicant.findAndCountAll({
    where,
    order: [['applicationDate', 'DESC']],
    limit: Number(limit),
    offset,
  });

  ResponseFormatter.success(res, {
    data: rows.map(toFrontend),
    pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / Number(limit)) },
  }, 'Visa applications retrieved');
}));

// GET /api/visamax/applications/stats
router.get('/applications/stats', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, pending, inProgress, approved, rejected] = await Promise.all([
    VisaApplicant.count(),
    VisaApplicant.count({ where: { status: 'New' } }),
    VisaApplicant.count({ where: { status: { [Op.in]: ['In Progress', 'Document Review', 'Interview'] } } }),
    VisaApplicant.count({ where: { status: 'Approved' } }),
    VisaApplicant.count({ where: { status: 'Rejected' } }),
  ]);

  ResponseFormatter.success(res, { total, pending, inProgress, approved, rejected }, 'Stats retrieved');
}));

// GET /api/visamax/applications/:id
router.get('/applications/:id', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const app = await VisaApplicant.findByPk(req.params.id);
  if (!app) return ResponseFormatter.notFound(res, 'Application not found');
  ResponseFormatter.success(res, toFrontend(app), 'Application retrieved');
}));

// POST /api/visamax/applications
router.post('/applications', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { clientName, clientPhone, clientEmail, serviceType, destination, status, applicationDate, expectedCompletion, assignedTo, notes, processingDate, actualCompletion } = req.body;

  if (!clientName || !serviceType || !destination) {
    return ResponseFormatter.error(res, 'clientName, serviceType, destination are required', 400);
  }

  const nameParts = (clientName as string).trim().split(' ');
  const firstName = nameParts[0] ?? clientName;
  const lastName = nameParts.slice(1).join(' ') || '-';

  const app = await VisaApplicant.create({
    organizationId: BigInt(1),
    firstName,
    lastName,
    email: clientEmail || `${Date.now()}@placeholder.com`,
    phone: clientPhone || '',
    passportNumber: `VX-${Date.now()}`,
    visaType: toVisaType(serviceType),
    destinationCountry: destination,
    applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
    status: toBackendStatus(status || 'Pending'),
    priorityLevel: 'Medium',
    documentStatus: 'Pending',
    expectedDecisionDate: expectedCompletion ? new Date(expectedCompletion) : undefined,
    notes: buildNotes({ serviceType, processingDate, expectedCompletion, actualCompletion, assignedTo, notes }),
  } as any);

  ResponseFormatter.success(res, toFrontend(app), 'Application created', 201);
}));

// PUT /api/visamax/applications/:id
router.put('/applications/:id', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const app = await VisaApplicant.findByPk(req.params.id);
  if (!app) return ResponseFormatter.notFound(res, 'Application not found');

  const { clientName, clientPhone, clientEmail, serviceType, destination, status, expectedCompletion, assignedTo, notes, processingDate, actualCompletion } = req.body;

  const nameParts = clientName ? (clientName as string).trim().split(' ') : null;
  const updates: any = {};

  if (nameParts) {
    updates.firstName = nameParts[0];
    updates.lastName = nameParts.slice(1).join(' ') || app.lastName;
  }
  if (clientPhone) updates.phone = clientPhone;
  if (clientEmail) updates.email = clientEmail;
  if (serviceType) updates.visaType = toVisaType(serviceType);
  if (destination) updates.destinationCountry = destination;
  if (status) updates.status = toBackendStatus(status);
  if (expectedCompletion) updates.expectedDecisionDate = new Date(expectedCompletion);

  // Rebuild notes with updated meta
  const currentMeta = {
    serviceType: serviceType ?? '',
    processingDate: processingDate ?? '',
    expectedCompletion: expectedCompletion ?? '',
    actualCompletion: actualCompletion ?? '',
    assignedTo: assignedTo ?? '',
    notes: notes ?? '',
  };
  updates.notes = buildNotes(currentMeta);

  await app.update(updates);
  ResponseFormatter.success(res, toFrontend(app.reload ? await app.reload() : app), 'Application updated');
}));

// PATCH /api/visamax/applications/:id/status
router.patch('/applications/:id/status', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status, rejectionReason } = req.body;
  if (!status) return ResponseFormatter.error(res, 'status is required', 400);

  const app = await VisaApplicant.findByPk(req.params.id);
  if (!app) return ResponseFormatter.notFound(res, 'Application not found');

  await app.update({ status: toBackendStatus(status), rejectionReason: rejectionReason ?? app.rejectionReason });
  ResponseFormatter.success(res, toFrontend(app), 'Status updated');
}));

// DELETE /api/visamax/applications/:id
router.delete('/applications/:id', AuthMiddleware.verifyToken, ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const app = await VisaApplicant.findByPk(req.params.id);
  if (!app) return ResponseFormatter.notFound(res, 'Application not found');
  await app.destroy();
  ResponseFormatter.success(res, null, 'Application deleted');
}));

export default router;
