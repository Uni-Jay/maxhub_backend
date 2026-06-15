import { Request, Response } from 'express';
import express from 'express';
import { Op } from 'sequelize';
import AuthMiddleware from '../middleware/AuthMiddleware';
import { Client } from '../models/Client.model';
import { ClientDocument } from '../models/ClientDocument.model';
import { ClientNote } from '../models/ClientNote.model';
import { Staff } from '../models/Staff.model';
import { Department } from '../models/Department.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = express.Router();

// GET /api/clients - list with search + filter
router.get(
  '/',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      search,
      status,
      departmentId,
      assignedStaffId,
      country,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (country) where.country = country;
    if (departmentId) where.departmentId = BigInt(departmentId);
    if (assignedStaffId) where.assignedStaffId = BigInt(assignedStaffId);
    if (search) {
      (where as any)[Op.or as unknown as string] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
        { clientId: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Client.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'uuid', 'clientId', 'fullName', 'email', 'phone',
        'country', 'departmentId', 'assignedStaffId', 'status',
        'registrationDate', 'avatar', 'createdAt',
      ],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  })
);

// GET /api/clients/stats
router.get(
  '/stats',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const [total, active, inactive, pending] = await Promise.all([
      Client.count(),
      Client.count({ where: { status: 'Active' } }),
      Client.count({ where: { status: 'Inactive' } }),
      Client.count({ where: { status: 'Pending' } }),
    ]);
    ResponseFormatter.success(res, { total, active, inactive, pending });
  })
);

// GET /api/clients/:id
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const client = await Client.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } as any,
    });
    if (!client) return ResponseFormatter.notFound(res, 'Client not found');
    ResponseFormatter.success(res, client.toJSON());
  })
);

// POST /api/clients
router.post(
  '/',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      fullName, email, phone, alternatePhone, address, city, state,
      country, nationality, dateOfBirth, departmentId, assignedStaffId,
      status = 'Active', notes,
    } = req.body;
    const userId = (req as any).user?.id || 1;

    const client = await Client.create({
      fullName,
      email,
      phone,
      alternatePhone,
      address,
      city,
      state,
      country,
      nationality,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      departmentId: departmentId ? BigInt(departmentId) : undefined,
      assignedStaffId: assignedStaffId ? BigInt(assignedStaffId) : undefined,
      registrationDate: new Date(),
      status,
      notes,
      createdByUserId: BigInt(userId),
    });

    ResponseFormatter.success(res, client.toJSON(), 'Client created successfully', 201);
  })
);

// PATCH /api/clients/:id
router.patch(
  '/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return ResponseFormatter.notFound(res, 'Client not found');

    const updates: Record<string, unknown> = {};
    const allowed = [
      'fullName', 'email', 'phone', 'alternatePhone', 'address', 'city', 'state',
      'country', 'nationality', 'dateOfBirth', 'status', 'notes', 'avatar', 'passportUrl',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (req.body.departmentId !== undefined)
      updates.departmentId = req.body.departmentId ? BigInt(req.body.departmentId) : null;
    if (req.body.assignedStaffId !== undefined)
      updates.assignedStaffId = req.body.assignedStaffId ? BigInt(req.body.assignedStaffId) : null;

    await client.update(updates);
    ResponseFormatter.success(res, client.toJSON(), 'Client updated');
  })
);

// DELETE /api/clients/:id
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return ResponseFormatter.notFound(res, 'Client not found');
    await client.destroy();
    ResponseFormatter.success(res, null, 'Client deleted');
  })
);

// ── Documents ──────────────────────────────────────────────────────────────

// GET /api/clients/:id/documents
router.get(
  '/:id/documents',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return ResponseFormatter.notFound(res, 'Client not found');

    const docs = await ClientDocument.findAll({
      where: { clientId: client.id },
      order: [['createdAt', 'DESC']],
    });
    ResponseFormatter.success(res, docs.map((d) => d.toJSON()));
  })
);

// POST /api/clients/:id/documents
router.post(
  '/:id/documents',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return ResponseFormatter.notFound(res, 'Client not found');

    const { documentName, category = 'Other', fileUrl, fileSize, mimeType, description } = req.body;
    const userId = (req as any).user?.id || 1;

    // Get next version for same document name
    const existing = await ClientDocument.count({
      where: { clientId: client.id, documentName },
    });

    const doc = await ClientDocument.create({
      clientId: client.id,
      documentName,
      category,
      fileUrl,
      fileSize,
      mimeType,
      description,
      version: existing + 1,
      uploadedByUserId: BigInt(userId),
    });

    ResponseFormatter.success(res, doc.toJSON(), 'Document uploaded', 201);
  })
);

// DELETE /api/clients/:id/documents/:docId
router.delete(
  '/:id/documents/:docId',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const doc = await ClientDocument.findOne({
      where: { id: BigInt(req.params.docId), clientId: BigInt(req.params.id) },
    });
    if (!doc) return ResponseFormatter.notFound(res, 'Document not found');
    await doc.destroy();
    ResponseFormatter.success(res, null, 'Document deleted');
  })
);

// ── Notes ──────────────────────────────────────────────────────────────────

// GET /api/clients/:id/notes
router.get(
  '/:id/notes',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return ResponseFormatter.notFound(res, 'Client not found');

    const notes = await ClientNote.findAll({
      where: { clientId: client.id },
      order: [['createdAt', 'DESC']],
    });
    ResponseFormatter.success(res, notes.map((n) => n.toJSON()));
  })
);

// POST /api/clients/:id/notes
router.post(
  '/:id/notes',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const client = await Client.findByPk(req.params.id);
    if (!client) return ResponseFormatter.notFound(res, 'Client not found');

    const { note } = req.body;
    const userId = (req as any).user?.id || 1;

    const clientNote = await ClientNote.create({
      clientId: client.id,
      note,
      createdByUserId: BigInt(userId),
    });
    ResponseFormatter.success(res, clientNote.toJSON(), 'Note added', 201);
  })
);

// DELETE /api/clients/:id/notes/:noteId
router.delete(
  '/:id/notes/:noteId',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const note = await ClientNote.findOne({
      where: { id: BigInt(req.params.noteId), clientId: BigInt(req.params.id) },
    });
    if (!note) return ResponseFormatter.notFound(res, 'Note not found');
    await note.destroy();
    ResponseFormatter.success(res, null, 'Note deleted');
  })
);

export default router;
