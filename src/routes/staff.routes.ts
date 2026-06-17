import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { Staff } from '@models/Staff.model';
import { Department } from '@models/Department.model';
import { Designation } from '@models/Designation.model';
import { User } from '@models/User.model';
import { Role } from '@models/Role.model';
import { Branch } from '@models/Branch.model';
import { Unit } from '@models/Unit.model';
import { StaffDepartment } from '@models/StaffDepartment.model';
import PasswordService from '@services/PasswordService';
import { sendWelcomeEmail } from '@services/CommunicationService';
import { upload, getFileUrl } from '@config/multer';

const router = Router();

// ─── GET /api/staff ──────────────────────────────────────────────────────────
router.get(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.departmentId) where.departmentId = BigInt(req.query.departmentId as string);
    if (req.query.branchId) where.branchId = BigInt(req.query.branchId as string);
    if (req.query.unitId) where.unitId = BigInt(req.query.unitId as string);
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
        { model: Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
        { model: Unit, as: 'unit', attributes: ['id', 'uuid', 'code', 'name'], required: false },
      ],
      limit,
      offset,
      order: [[req.sort?.field || 'createdAt', req.sort?.order || 'DESC']],
      paranoid: true,
    });

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

// ─── GET /api/staff/:id ───────────────────────────────────────────────────────
router.get(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
      include: [
        { model: Department, attributes: ['id', 'name', 'code'] },
        { model: Designation, attributes: ['id', 'title'] },
        { model: Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
        { model: Unit, as: 'unit', attributes: ['id', 'uuid', 'code', 'name'], required: false },
        {
          model: Department,
          as: 'departments',
          through: { attributes: ['isPrimary', 'assignedAt'] },
          attributes: ['id', 'uuid', 'code', 'name'],
          required: false,
        },
      ],
    });

    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, staff.toJSON());
  })
);

// ─── POST /api/staff ─────────────────────────────────────────────────────────
router.post(
  '/',
  AuthMiddleware.requirePermission('org.staff.create.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName, lastName, email, phone, employeeId,
      departmentId, designationId, locationId,
      joiningDate, dateOfBirth, gender, alternatePhone,
      whatsappNumber, socialMediaHandle, homeAddress,
      position, customPosition, businessUnit, additionalUnits,
      branchId, unitId,
      // Employment
      jobTitle, hireDate, employmentStatus,
      // Education
      educationLevel, degree, institution, major, graduationYear, nyscCompleted,
      // Emergency
      emergencyContactName, emergencyContactPhone, emergencyRelationship,
      emergencyHomeAddress, emergencyOfficeAddress,
      // Identity
      validIdType, validIdNumber,
      // Certifications & work history
      hasCertification, certifications, previousWorkHistory, skills,
      // Guarantor 1
      guarantor1Name, guarantor1Relationship, guarantor1Phone,
      guarantor1Address, guarantor1Email, guarantor1Occupation, guarantor1DurationKnown,
      // Guarantor 2
      guarantor2Name, guarantor2Relationship, guarantor2Phone,
      guarantor2Address, guarantor2Email, guarantor2Occupation, guarantor2DurationKnown,
      // Bank
      bankName, accountType, accountName, accountNumber,
      // Health
      hasMedicalCondition, medicalConditions, medications,
      // Acknowledgment
      readJobDescription, acceptedCompanyPolicy, receivedCompanyAssets, assignedAssets,
      // Other
      bloodGroup, maritalStatus, nationality,
    } = req.body;

    const [existingStaff, existingUser] = await Promise.all([
      Staff.findOne({ where: { email } }),
      User.findOne({ where: { email } }),
    ]);
    if (existingStaff || existingUser) {
      return ResponseFormatter.conflict(res, 'A staff member with this email already exists');
    }

    const resolvedPosition: string | undefined = customPosition?.trim() || position?.trim() || undefined;
    const allUnits: string[] = [];
    if (businessUnit) allUnits.push(businessUnit);
    if (Array.isArray(additionalUnits)) {
      for (const u of additionalUnits) {
        if (u && !allUnits.includes(u)) allUnits.push(u);
      }
    }

    const temporaryPassword = PasswordService.generateRandomPassword(12);
    const passwordHash = await PasswordService.hashPassword(temporaryPassword);

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
      status: 'Active',
      emailVerified: true,
    } as any);

    const staffRole = await Role.findOne({ where: { code: 'staff' } });
    if (staffRole) {
      await (user as any).addRole(staffRole);
    }

    const staff = await Staff.create({
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      whatsappNumber,
      socialMediaHandle,
      homeAddress,
      gender,
      employeeId: employeeId || undefined,
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
      branchId: branchId ? BigInt(branchId) : undefined,
      unitId: unitId ? BigInt(unitId) : undefined,
      jobTitle,
      hireDate: hireDate ? new Date(hireDate) : undefined,
      employmentStatus,
      educationLevel,
      degree,
      institution,
      major,
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      nyscCompleted,
      hasCertification,
      certifications,
      previousWorkHistory,
      skills,
      emergencyContactName,
      emergencyContactPhone,
      emergencyRelationship,
      emergencyHomeAddress,
      emergencyOfficeAddress,
      validIdType,
      validIdNumber,
      guarantor1Name, guarantor1Relationship, guarantor1Phone,
      guarantor1Address, guarantor1Email, guarantor1Occupation, guarantor1DurationKnown,
      guarantor2Name, guarantor2Relationship, guarantor2Phone,
      guarantor2Address, guarantor2Email, guarantor2Occupation, guarantor2DurationKnown,
      bankName,
      accountType,
      accountName,
      accountNumber,
      hasMedicalCondition,
      medicalConditions,
      medications,
      readJobDescription,
      acceptedCompanyPolicy,
      receivedCompanyAssets,
      assignedAssets,
      bloodGroup,
      maritalStatus,
      nationality,
    } as any);

    const dept = departmentId ? await Department.findByPk(departmentId, { attributes: ['name'] }) : null;

    sendWelcomeEmail({
      to: email,
      firstName,
      lastName,
      employeeId: staff.employeeId,
      temporaryPassword,
      position: resolvedPosition,
      businessUnit: businessUnit || undefined,
      department: (dept as any)?.name || undefined,
    }).catch(err => console.error('[Staff] Welcome email failed:', err));

    ResponseFormatter.success(res, staff.toJSON(), 'Staff member created successfully', 201);
  })
);

// ─── PATCH /api/staff/:id ─────────────────────────────────────────────────────
router.patch(
  '/:id',
  AuthMiddleware.requirePermission('org.staff.update.all', 'org.staff.update.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');

    const updatableFields = [
      'firstName', 'lastName', 'phone', 'alternatePhone', 'whatsappNumber', 'socialMediaHandle',
      'status', 'gender', 'homeAddress', 'validIdType', 'validIdNumber',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyRelationship',
      'emergencyHomeAddress', 'emergencyOfficeAddress',
      'educationLevel', 'degree', 'institution', 'major', 'graduationYear', 'nyscCompleted',
      'hasCertification', 'certifications', 'previousWorkHistory', 'skills',
      'guarantor1Name', 'guarantor1Relationship', 'guarantor1Phone',
      'guarantor1Address', 'guarantor1Email', 'guarantor1Occupation', 'guarantor1DurationKnown',
      'guarantor2Name', 'guarantor2Relationship', 'guarantor2Phone',
      'guarantor2Address', 'guarantor2Email', 'guarantor2Occupation', 'guarantor2DurationKnown',
      'jobTitle', 'hireDate', 'employmentStatus',
      'bankName', 'accountType', 'accountName', 'accountNumber',
      'hasMedicalCondition', 'medicalConditions', 'medications',
      'readJobDescription', 'acceptedCompanyPolicy', 'receivedCompanyAssets', 'assignedAssets',
      'bloodGroup', 'maritalStatus', 'nationality',
      'position', 'businessUnit', 'businessUnits',
    ];

    const updates: Record<string, unknown> = {};
    updatableFields.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    // BigInt FK updates
    if (req.body.departmentId !== undefined) updates.departmentId = BigInt(req.body.departmentId);
    if (req.body.designationId !== undefined) updates.designationId = BigInt(req.body.designationId);
    if (req.body.locationId !== undefined) updates.locationId = BigInt(req.body.locationId);
    if (req.body.branchId !== undefined) updates.branchId = req.body.branchId ? BigInt(req.body.branchId) : null;
    if (req.body.unitId !== undefined) updates.unitId = req.body.unitId ? BigInt(req.body.unitId) : null;

    // customPosition takes priority
    if (req.body.customPosition?.trim()) updates.position = req.body.customPosition.trim();

    await staff.update(updates as any);
    ResponseFormatter.success(res, staff.toJSON(), 'Staff member updated successfully');
  })
);

// ─── DELETE /api/staff/:id ───────────────────────────────────────────────────
router.delete(
  '/:id',
  AuthMiddleware.requirePermission('org.staff.delete.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    await staff.destroy();
    ResponseFormatter.success(res, null, 'Staff member deleted successfully');
  })
);

// ─── POST /api/staff/:id/documents/upload ─────────────────────────────────────
// Upload a staff document (id_card, utility_bill, certificate, nysc, signature)
router.post(
  '/:id/documents/upload',
  AuthMiddleware.requirePermission('org.staff.update.all', 'org.staff.update.own'),
  upload.single('file'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    if (!req.file) return ResponseFormatter.error(res, 'No file uploaded', 400);

    const { documentType } = req.body;
    const fileUrl = getFileUrl(req.file.filename);

    const fieldMap: Record<string, string> = {
      id_card: 'idDocument',
      utility_bill: 'utilityBillDocument',
      certificate: 'certificateDocument',
      signature: 'signatureImage',
    };

    const field = fieldMap[documentType];
    if (!field) {
      return ResponseFormatter.error(res, `Invalid documentType. Use: ${Object.keys(fieldMap).join(', ')}`, 400);
    }

    await staff.update({ [field]: fileUrl } as any);

    ResponseFormatter.success(res, {
      documentType,
      fileUrl,
      uploadedAt: new Date().toISOString(),
    }, 'Document uploaded successfully');
  })
);

// ─── GET /api/staff/:id/departments ──────────────────────────────────────────
router.get(
  '/:id/departments',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
      include: [
        {
          model: Department,
          as: 'departments',
          through: { attributes: ['isPrimary', 'assignedAt'] },
          attributes: ['id', 'uuid', 'code', 'name', 'status'],
          required: false,
        },
      ],
    });

    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, (staff as any).departments || []);
  })
);

// ─── POST /api/staff/:id/departments ─────────────────────────────────────────
// Assign staff to a department
router.post(
  '/:id/departments',
  AuthMiddleware.requirePermission('org.staff.update.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');

    const { departmentId, isPrimary } = req.body;
    if (!departmentId) return ResponseFormatter.error(res, 'departmentId is required', 400);

    const dept = await Department.findByPk(departmentId);
    if (!dept) return ResponseFormatter.notFound(res, 'Department not found');

    // If marking as primary, unset existing primary
    if (isPrimary) {
      await StaffDepartment.update(
        { isPrimary: false },
        { where: { staffId: staff.id } }
      );
    }

    const [link, created] = await StaffDepartment.findOrCreate({
      where: { staffId: staff.id, departmentId: BigInt(departmentId) },
      defaults: {
        staffId: staff.id,
        departmentId: BigInt(departmentId),
        isPrimary: Boolean(isPrimary),
        assignedAt: new Date(),
      },
    });

    if (!created) {
      await link.update({ isPrimary: Boolean(isPrimary) });
    }

    ResponseFormatter.success(res, link.toJSON(), created ? 'Department assigned' : 'Department assignment updated', created ? 201 : 200);
  })
);

// ─── DELETE /api/staff/:id/departments/:departmentId ─────────────────────────
// Remove staff from a department
router.delete(
  '/:id/departments/:departmentId',
  AuthMiddleware.requirePermission('org.staff.update.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');

    const link = await StaffDepartment.findOne({
      where: {
        staffId: staff.id,
        departmentId: BigInt(req.params.departmentId),
      },
    });

    if (!link) return ResponseFormatter.notFound(res, 'Department assignment not found');

    await link.destroy();
    ResponseFormatter.success(res, null, 'Staff removed from department');
  })
);

// ─── GET /api/staff/:id/qualifications ───────────────────────────────────────
router.get(
  '/:id/qualifications',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, []);
  })
);

// ─── GET /api/staff/:id/skills ───────────────────────────────────────────────
router.get(
  '/:id/skills',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter.success(res, []);
  })
);

// ─── GET /api/staff/:id/documents ────────────────────────────────────────────
router.get(
  '/:id/documents',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
      attributes: ['idDocument', 'utilityBillDocument', 'certificateDocument', 'signatureImage'],
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');

    const docs = {
      idDocument: staff.idDocument || null,
      utilityBillDocument: staff.utilityBillDocument || null,
      certificateDocument: staff.certificateDocument || null,
      signatureImage: staff.signatureImage || null,
    };

    ResponseFormatter.success(res, docs);
  })
);

export default router;
