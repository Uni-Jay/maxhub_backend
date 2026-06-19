import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { getRoleBucket } from '@utils/RoleBucket';
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

function isBypassRole(req: Request): boolean {
  const roles = ((req as any).user?.roles || []).map((r: string) => r.toLowerCase().replace(/[^a-z]/g, ''));
  return roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin');
}

function hasPermission(req: Request, code: string): boolean {
  if (isBypassRole(req)) return true;
  const perms = new Set(((req as any).user?.permissions || []).map((p: string) => String(p).toLowerCase()));
  return perms.has(code.toLowerCase());
}

/** True when the caller's only path to this action is the own_department-scoped permission (e.g. HOD). */
function isDepartmentScopedOnly(req: Request, allCode: string, deptCode: string): boolean {
  return !hasPermission(req, allCode) && hasPermission(req, deptCode);
}

const STAFF_SORTABLE_FIELDS = new Set([
  'createdAt', 'updatedAt', 'firstName', 'lastName', 'employeeId',
  'joiningDate', 'status', 'departmentId',
]);

/**
 * Core staff search/filter query — shared by the /api/staff route and the AI
 * assistant's searchEmployees tool, so both surfaces stay behaviorally identical.
 */
export async function searchStaff(filters: {
  search?: string; status?: string; departmentId?: string | number;
  branchId?: string | number; unitId?: string | number;
  limit?: number; offset?: number; sortField?: string; sortOrder?: 'ASC' | 'DESC';
}) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.departmentId) where.departmentId = BigInt(filters.departmentId);
  if (filters.branchId) where.branchId = BigInt(filters.branchId);
  if (filters.unitId) where.unitId = BigInt(filters.unitId);
  if (filters.search) {
    const s = `%${filters.search}%`;
    where[Op.or as unknown as string] = [
      { firstName: { [Op.iLike]: s } },
      { lastName: { [Op.iLike]: s } },
      { email: { [Op.iLike]: s } },
      { employeeId: { [Op.iLike]: s } },
    ];
  }

  return Staff.findAndCountAll({
    where,
    include: [
      { model: Department, as: 'department', attributes: ['id', 'name', 'code'], required: false },
      { model: Designation, as: 'designation', attributes: ['id', 'name'], required: false },
      { model: Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
      { model: Unit, as: 'unit', attributes: ['id', 'uuid', 'code', 'name'], required: false },
    ],
    limit: filters.limit ?? 20,
    offset: filters.offset ?? 0,
    order: [[STAFF_SORTABLE_FIELDS.has(filters.sortField || '') ? filters.sortField! : 'createdAt', filters.sortOrder || 'DESC']],
    paranoid: true,
  });
}

// ─── GET /api/staff ──────────────────────────────────────────────────────────
router.get(
  '/',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;

    const departmentScoped = isDepartmentScopedOnly(req, 'org.staff.read.all', 'org.staff.read.own_department');
    const departmentId = departmentScoped
      ? (req as any).user?.departmentId ?? undefined
      : (req.query.departmentId as string | undefined);

    const { count, rows } = await searchStaff({
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
      departmentId,
      branchId: req.query.branchId as string | undefined,
      unitId: req.query.unitId as string | undefined,
      limit, offset,
      sortField: req.sort?.field, sortOrder: req.sort?.order,
    });

    ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
  })
);

// ─── GET /api/staff/:id ───────────────────────────────────────────────────────
router.get(
  '/:id',
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { ...idOrUuidWhere(req.params.id) },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
        { model: Designation, as: 'designation', attributes: ['id', 'name'] },
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

    if (isDepartmentScopedOnly(req, 'org.staff.read.all', 'org.staff.read.own_department')) {
      if (String((staff as any).departmentId) !== String((req as any).user?.departmentId)) {
        return ResponseFormatter.notFound(res, 'Staff member not found');
      }
    }

    ResponseFormatter.success(res, staff.toJSON());
  })
);

// ─── POST /api/staff ─────────────────────────────────────────────────────────
router.post(
  '/',
  AuthMiddleware.requirePermission('org.staff.create.all', 'org.staff.create.own_department'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName, lastName, email, phone, employeeId,
      departmentId: bodyDepartmentId, designationId, locationId,
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
      // Documents (Cloudinary URLs)
      idDocument, utilityBillDocument, certificateDocument, signatureImage,
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

    // HOD-style callers (create.own_department only) can only ever create staff in their own department.
    const departmentId = isDepartmentScopedOnly(req, 'org.staff.create.all', 'org.staff.create.own_department')
      ? (req as any).user?.departmentId
      : bodyDepartmentId;

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
      designationId: designationId ? BigInt(designationId) : undefined,
      locationId: locationId ? BigInt(locationId) : undefined,
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
      idDocument,
      utilityBillDocument,
      certificateDocument,
      signatureImage,
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

    ResponseFormatter.success(res, { ...staff.toJSON(), temporaryPassword }, 'Staff member created successfully', 201);
  })
);

// ─── PATCH /api/staff/:id ─────────────────────────────────────────────────────
router.patch(
  '/:id',
  AuthMiddleware.requirePermission('org.staff.update.all', 'org.staff.update.own', 'org.staff.update.own_department'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { ...idOrUuidWhere(req.params.id) },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');

    const departmentScoped = isDepartmentScopedOnly(req, 'org.staff.update.all', 'org.staff.update.own_department');
    if (departmentScoped && String((staff as any).departmentId) !== String((req as any).user?.departmentId)) {
      return ResponseFormatter.notFound(res, 'Staff member not found');
    }

    const updatableFields = [
      'firstName', 'lastName', 'phone', 'alternatePhone', 'whatsappNumber', 'socialMediaHandle',
      'status', 'gender', 'homeAddress', 'validIdType', 'validIdNumber',
      'idDocument', 'utilityBillDocument', 'certificateDocument', 'signatureImage',
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

    // BigInt FK updates — department-scoped callers (HOD) can never move a staff member to another department
    if (req.body.departmentId !== undefined && !departmentScoped) updates.departmentId = BigInt(req.body.departmentId);
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
  AuthMiddleware.requirePermission('org.staff.delete.all', 'org.staff.delete.own_department'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const staff = await Staff.findOne({
      where: { ...idOrUuidWhere(req.params.id) },
    });
    if (!staff) return ResponseFormatter.notFound(res, 'Staff member not found');

    if (isDepartmentScopedOnly(req, 'org.staff.delete.all', 'org.staff.delete.own_department')
        && String((staff as any).departmentId) !== String((req as any).user?.departmentId)) {
      return ResponseFormatter.notFound(res, 'Staff member not found');
    }

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
      where: { ...idOrUuidWhere(req.params.id) },
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
      where: { ...idOrUuidWhere(req.params.id) },
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
      where: { ...idOrUuidWhere(req.params.id) },
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
      where: { ...idOrUuidWhere(req.params.id) },
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
      where: { ...idOrUuidWhere(req.params.id) },
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
      where: { ...idOrUuidWhere(req.params.id) },
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
      where: { ...idOrUuidWhere(req.params.id) },
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
