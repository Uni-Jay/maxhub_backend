import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Unit } from '@models/Unit.model';
import { Branch } from '@models/Branch.model';
import { User } from '@models/User.model';
import { Staff } from '@models/Staff.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/units — list units (filterable by branchId)
router.get(
  '/',
  AuthMiddleware.requirePermission('org.unit.read.all', 'org.unit.read.own_branch'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.branchId) where.branchId = BigInt(req.query.branchId as string);
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      const s = `%${req.query.search}%`;
      where[Op.or as unknown as string] = [
        { name: { [Op.iLike]: s } },
        { code: { [Op.iLike]: s } },
      ];
    }

    const { count, rows } = await Unit.findAndCountAll({
      where,
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
        { model: User, as: 'head', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      ],
      limit,
      offset,
      order: [['name', 'ASC']],
      paranoid: true,
    });

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

// GET /api/units/:id
router.get(
  '/:id',
  AuthMiddleware.requirePermission('org.unit.read.all', 'org.unit.read.own_branch'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const unit = await Unit.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
      include: [
        { model: Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
        { model: User, as: 'head', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      ],
    });

    if (!unit) return ResponseFormatter.notFound(res, 'Unit not found');

    const staffCount = await Staff.count({ where: { unitId: unit.id } });
    ResponseFormatter.success(res, { ...unit.toJSON(), staffCount });
  })
);

// POST /api/units — create unit
router.post(
  '/',
  AuthMiddleware.requirePermission('org.unit.create.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { name, code, description, branchId, headUserId, status } = req.body;

    if (!name || !code) {
      return ResponseFormatter.error(res, 'name and code are required', 400);
    }

    const unit = await Unit.create({
      uuid: uuidv4(),
      name,
      code: code.toUpperCase(),
      description,
      branchId: branchId ? BigInt(branchId) : undefined,
      headUserId: headUserId ? BigInt(headUserId) : undefined,
      status: status || 'Active',
    });

    ResponseFormatter.success(res, unit.toJSON(), 'Unit created successfully', 201);
  })
);

// PATCH /api/units/:id — update unit
router.patch(
  '/:id',
  AuthMiddleware.requirePermission('org.unit.update.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const unit = await Unit.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });

    if (!unit) return ResponseFormatter.notFound(res, 'Unit not found');

    const allowed = ['name', 'code', 'description', 'branchId', 'headUserId', 'status'];
    const updates: Record<string, unknown> = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    await unit.update(updates);
    ResponseFormatter.success(res, unit.toJSON(), 'Unit updated successfully');
  })
);

// DELETE /api/units/:id — soft delete
router.delete(
  '/:id',
  AuthMiddleware.requirePermission('org.unit.delete.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const unit = await Unit.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });

    if (!unit) return ResponseFormatter.notFound(res, 'Unit not found');

    await unit.destroy();
    ResponseFormatter.success(res, null, 'Unit deleted successfully');
  })
);

export default router;
