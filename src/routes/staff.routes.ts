import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { Staff } from '@models/Staff.model';
import { Department } from '@models/Department.model';
import { Designation } from '@models/Designation.model';

const router = Router();

router.get(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.departmentId) where.departmentId = BigInt(req.query.departmentId as string);
    if (req.query.search) {
      const s = `%${req.query.search}%`;
      where[Op.or as unknown as string] = [
        { firstName: { [Op.like]: s } },
        { lastName: { [Op.like]: s } },
        { email: { [Op.like]: s } },
        { employeeId: { [Op.like]: s } },
      ];
    }

    const { count, rows } = await Staff.findAndCountAll({
      where,
      include: [
        { model: Department, attributes: ['id', 'name', 'code'], required: false },
        { model: Designation, attributes: ['id', 'title'], required: false },
      ],
      limit,
      offset,
      order: [[req.sort?.field || 'createdAt', req.sort?.order || 'DESC']],
      paranoid: true,
    });

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

router.get(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'name', 'code'] },
        { model: Designation, attributes: ['id', 'title'] },
      ],
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, staff.toJSON());
  })
);

router.post(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName, lastName, email, phone, employeeId,
      departmentId, designationId, locationId,
      joiningDate, dateOfBirth, gender, alternatePhone,
    } = req.body;

    const existing = await Staff.findOne({ where: { email } });
    if (existing) return ResponseFormatter.conflict(res, 'A staff member with this email already exists');

    const staff = await Staff.create({
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      gender,
      employeeId: employeeId || `EMP${Date.now()}`,
      departmentId: BigInt(departmentId),
      designationId: BigInt(designationId),
      locationId: BigInt(locationId || 1),
      userId: BigInt((req as unknown as { user?: { id: number } }).user?.id || 1),
      joiningDate: new Date(joiningDate),
      dateOfBirth: new Date(dateOfBirth),
      status: 'Active',
    });

    ResponseFormatter.success(res, staff.toJSON(), 'Staff member created successfully', 201);
  })
);

router.patch(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');

    const {
      firstName, lastName, phone, status,
      departmentId, designationId, alternatePhone,
      emergencyContactName, emergencyContactPhone,
    } = req.body;

    await staff.update({
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(status !== undefined && { status }),
      ...(alternatePhone !== undefined && { alternatePhone }),
      ...(emergencyContactName !== undefined && { emergencyContactName }),
      ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
      ...(departmentId !== undefined && { departmentId: BigInt(departmentId) }),
      ...(designationId !== undefined && { designationId: BigInt(designationId) }),
    });

    ResponseFormatter.success(res, staff.toJSON(), 'Staff member updated successfully');
  })
);

router.delete(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    await staff.destroy();
    ResponseFormatter.success(res, null, 'Staff member deleted successfully');
  })
);

router.get(
  '/:id/qualifications',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, []);
  })
);

router.get(
  '/:id/skills',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, []);
  })
);

router.get(
  '/:id/documents',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findByPk(req.params.id);
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, []);
  })
);

export default router;
