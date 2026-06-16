import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { Staff } from '@models/Staff.model';
import { Department } from '@models/Department.model';
import { Designation } from '@models/Designation.model';
import { User } from '@models/User.model';
import { Role } from '@models/Role.model';
import PasswordService from '@services/PasswordService';
import { sendWelcomeEmail } from '@services/CommunicationService';

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
      position, customPosition, businessUnit, additionalUnits,
    } = req.body;

    // Check for duplicate email across both staff and users tables
    const [existingStaff, existingUser] = await Promise.all([
      Staff.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
    ]);
    if (existingStaff || existingUser) {
      return ResponseFormatter.conflict(res, 'A staff member with this email already exists');
    }

    // Resolve position: custom text takes priority
    const resolvedPosition: string | undefined = customPosition?.trim() || position?.trim() || undefined;

    // Build deduplicated businessUnits array
    const allUnits: string[] = [];
    if (businessUnit) allUnits.push(businessUnit);
    if (Array.isArray(additionalUnits)) {
      for (const u of additionalUnits) {
        if (u && !allUnits.includes(u)) allUnits.push(u);
      }
    }

    // Generate temporary password and hash it
    const temporaryPassword = PasswordService.generateRandomPassword(12);
    const passwordHash = await PasswordService.hashPassword(temporaryPassword);

    // Create the user account
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      status: 'Active',
      emailVerified: true,
    } as any);

    // Assign staff role
    const staffRole = await Role.findOne({ where: { code: 'staff' } });
    if (staffRole) {
      await user.addRole(staffRole);
    }

    // Create staff record linked to the new user
    const resolvedEmployeeId = employeeId || `EMP${Date.now()}`;
    const staff = await Staff.create({
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      gender,
      employeeId: resolvedEmployeeId,
      departmentId: BigInt(departmentId),
      designationId: BigInt(designationId || 1),
      locationId: BigInt(locationId || 1),
      userId: user.id,
      joiningDate: new Date(joiningDate),
      dateOfBirth: new Date(dateOfBirth),
      status: 'Active',
      position: resolvedPosition,
      businessUnit: businessUnit || undefined,
      businessUnits: allUnits.length ? allUnits : undefined,
    } as any);

    // Fetch department name for the welcome email (non-blocking)
    const dept = departmentId ? await Department.findByPk(departmentId, { attributes: ['name'] }) : null;

    // Send welcome email — fire-and-forget, don't block the response
    sendWelcomeEmail({
      to: email,
      firstName,
      lastName,
      employeeId: resolvedEmployeeId,
      temporaryPassword,
      position: resolvedPosition,
      businessUnit: businessUnit || undefined,
      department: (dept as any)?.name || undefined,
    }).catch(err => console.error('[Staff] Welcome email failed:', err));

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
      position, customPosition, businessUnit, additionalUnits,
    } = req.body;

    const resolvedPosition: string | undefined = customPosition?.trim() || position?.trim() || undefined;
    const allUnits: string[] = [];
    if (businessUnit) allUnits.push(businessUnit);
    if (Array.isArray(additionalUnits)) {
      for (const u of additionalUnits) {
        if (u && !allUnits.includes(u)) allUnits.push(u);
      }
    }

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
      ...(resolvedPosition !== undefined && { position: resolvedPosition }),
      ...(businessUnit !== undefined && { businessUnit }),
      ...(allUnits.length > 0 && { businessUnits: allUnits }),
    } as any);

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
