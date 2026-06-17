import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Branch } from '@models/Branch.model';
import { User } from '@models/User.model';
import { Department } from '@models/Department.model';
import { Unit } from '@models/Unit.model';
import { Staff } from '@models/Staff.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/branches — list all branches
router.get(
  '/',
  AuthMiddleware.requirePermission('org.branch.read.all', 'org.branch.read.own_branch'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      const s = `%${req.query.search}%`;
      where[Op.or as unknown as string] = [
        { branchName: { [Op.iLike]: s } },
        { branchCode: { [Op.iLike]: s } },
        { city: { [Op.iLike]: s } },
      ];
    }

    const { count, rows } = await Branch.findAndCountAll({
      where,
      include: [
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
      ],
      limit,
      offset,
      order: [['branchName', 'ASC']],
      paranoid: true,
    });

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

// GET /api/branches/:id — single branch with departments, units, staff count
router.get(
  '/:id',
  AuthMiddleware.requirePermission('org.branch.read.all', 'org.branch.read.own_branch'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const branch = await Branch.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
      include: [
        { model: User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        { model: Department, as: 'departments', attributes: ['id', 'uuid', 'code', 'name', 'status'], required: false },
        { model: Unit, as: 'units', attributes: ['id', 'uuid', 'code', 'name', 'status'], required: false },
      ],
    });

    if (!branch) return ResponseFormatter.notFound(res, 'Branch not found');

    const staffCount = await Staff.count({ where: { branchId: branch.id } });
    const result = { ...branch.toJSON(), staffCount };

    ResponseFormatter.success(res, result);
  })
);

// POST /api/branches — create branch
router.post(
  '/',
  AuthMiddleware.requirePermission('org.branch.create.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { branchCode, branchName, country, state, city, address, phone, email, managerId, status } = req.body;

    if (!branchCode || !branchName) {
      return ResponseFormatter.error(res, 'branchCode and branchName are required', 400);
    }

    const existing = await Branch.findOne({ where: { branchCode } });
    if (existing) return ResponseFormatter.error(res, 'Branch code already exists', 409);

    const branch = await Branch.create({
      uuid: uuidv4(),
      branchCode: branchCode.toUpperCase(),
      branchName,
      country,
      state,
      city,
      address,
      phone,
      email,
      managerId: managerId ? BigInt(managerId) : undefined,
      status: status || 'Active',
    });

    ResponseFormatter.success(res, branch.toJSON(), 'Branch created successfully', 201);
  })
);

// PATCH /api/branches/:id — update branch
router.patch(
  '/:id',
  AuthMiddleware.requirePermission('org.branch.update.all', 'org.branch.update.own_branch'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const branch = await Branch.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });

    if (!branch) return ResponseFormatter.notFound(res, 'Branch not found');

    const allowed = ['branchName', 'country', 'state', 'city', 'address', 'phone', 'email', 'managerId', 'status'];
    const updates: Record<string, unknown> = {};
    allowed.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    await branch.update(updates);
    ResponseFormatter.success(res, branch.toJSON(), 'Branch updated successfully');
  })
);

// DELETE /api/branches/:id — soft delete
router.delete(
  '/:id',
  AuthMiddleware.requirePermission('org.branch.delete.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const branch = await Branch.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });

    if (!branch) return ResponseFormatter.notFound(res, 'Branch not found');

    await branch.destroy();
    ResponseFormatter.success(res, null, 'Branch deleted successfully');
  })
);

export default router;
