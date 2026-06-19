"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchStaff = searchStaff;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const Staff_model_1 = require("../models/Staff.model");
const Department_model_1 = require("../models/Department.model");
const Designation_model_1 = require("../models/Designation.model");
const User_model_1 = require("../models/User.model");
const Role_model_1 = require("../models/Role.model");
const Branch_model_1 = require("../models/Branch.model");
const Unit_model_1 = require("../models/Unit.model");
const StaffDepartment_model_1 = require("../models/StaffDepartment.model");
const PasswordService_1 = __importDefault(require("../services/PasswordService"));
const CommunicationService_1 = require("../services/CommunicationService");
const multer_1 = require("../config/multer");
const PositionRoleMap_1 = require("../config/PositionRoleMap");
const router = (0, express_1.Router)();
function isBypassRole(req) {
    const roles = (req.user?.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    return roles.includes('superadmin') || roles.includes('admin') || roles.includes('headofadmin');
}
function hasPermission(req, code) {
    if (isBypassRole(req))
        return true;
    const perms = new Set((req.user?.permissions || []).map((p) => String(p).toLowerCase()));
    return perms.has(code.toLowerCase());
}
function isDepartmentScopedOnly(req, allCode, deptCode) {
    return !hasPermission(req, allCode) && hasPermission(req, deptCode);
}
const STAFF_SORTABLE_FIELDS = new Set([
    'createdAt', 'updatedAt', 'firstName', 'lastName', 'employeeId',
    'joiningDate', 'status', 'departmentId',
]);
async function searchStaff(filters) {
    const where = {};
    if (filters.status)
        where.status = filters.status;
    if (filters.departmentId)
        where.departmentId = BigInt(filters.departmentId);
    if (filters.branchId)
        where.branchId = BigInt(filters.branchId);
    if (filters.unitId)
        where.unitId = BigInt(filters.unitId);
    if (filters.search) {
        const s = `%${filters.search}%`;
        where[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.iLike]: s } },
            { lastName: { [sequelize_1.Op.iLike]: s } },
            { email: { [sequelize_1.Op.iLike]: s } },
            { employeeId: { [sequelize_1.Op.iLike]: s } },
        ];
    }
    return Staff_model_1.Staff.findAndCountAll({
        where,
        include: [
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'], required: false },
            { model: Designation_model_1.Designation, as: 'designation', attributes: ['id', 'name'], required: false },
            { model: Branch_model_1.Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
            { model: Unit_model_1.Unit, as: 'unit', attributes: ['id', 'uuid', 'code', 'name'], required: false },
        ],
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
        order: [[STAFF_SORTABLE_FIELDS.has(filters.sortField || '') ? filters.sortField : 'createdAt', filters.sortOrder || 'DESC']],
        paranoid: true,
    });
}
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;
    const departmentScoped = isDepartmentScopedOnly(req, 'org.staff.read.all', 'org.staff.read.own_department');
    const departmentId = departmentScoped
        ? req.user?.departmentId ?? undefined
        : req.query.departmentId;
    const { count, rows } = await searchStaff({
        search: req.query.search,
        status: req.query.status,
        departmentId,
        branchId: req.query.branchId,
        unitId: req.query.unitId,
        limit, offset,
        sortField: req.sort?.field, sortOrder: req.sort?.order,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [
            { model: Department_model_1.Department, as: 'department', attributes: ['id', 'name', 'code'] },
            { model: Designation_model_1.Designation, as: 'designation', attributes: ['id', 'name'] },
            { model: Branch_model_1.Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
            { model: Unit_model_1.Unit, as: 'unit', attributes: ['id', 'uuid', 'code', 'name'], required: false },
            {
                model: Department_model_1.Department,
                as: 'departments',
                through: { attributes: ['isPrimary', 'assignedAt'] },
                attributes: ['id', 'uuid', 'code', 'name'],
                required: false,
            },
        ],
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    if (isDepartmentScopedOnly(req, 'org.staff.read.all', 'org.staff.read.own_department')) {
        if (String(staff.departmentId) !== String(req.user?.departmentId)) {
            return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, staff.toJSON());
}));
router.post('/', AuthMiddleware_1.default.requirePermission('org.staff.create.all', 'org.staff.create.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, employeeId, departmentId: bodyDepartmentId, additionalDepartmentIds, designationId, locationId, joiningDate, dateOfBirth, gender, alternatePhone, whatsappNumber, socialMediaHandle, homeAddress, position, customPosition, businessUnit, additionalUnits, branchId, unitId, jobTitle, hireDate, employmentStatus, educationLevel, degree, institution, major, graduationYear, nyscCompleted, emergencyContactName, emergencyContactPhone, emergencyRelationship, emergencyHomeAddress, emergencyOfficeAddress, validIdType, validIdNumber, idDocument, utilityBillDocument, certificateDocument, signatureImage, hasCertification, certifications, previousWorkHistory, skills, guarantor1Name, guarantor1Relationship, guarantor1Phone, guarantor1Address, guarantor1Email, guarantor1Occupation, guarantor1DurationKnown, guarantor2Name, guarantor2Relationship, guarantor2Phone, guarantor2Address, guarantor2Email, guarantor2Occupation, guarantor2DurationKnown, bankName, accountType, accountName, accountNumber, hasMedicalCondition, medicalConditions, medications, readJobDescription, acceptedCompanyPolicy, receivedCompanyAssets, assignedAssets, bloodGroup, maritalStatus, nationality, } = req.body;
    const departmentId = isDepartmentScopedOnly(req, 'org.staff.create.all', 'org.staff.create.own_department')
        ? req.user?.departmentId
        : bodyDepartmentId;
    const [existingStaff, existingUser] = await Promise.all([
        Staff_model_1.Staff.findOne({ where: { email } }),
        User_model_1.User.findOne({ where: { email } }),
    ]);
    if (existingStaff || existingUser) {
        return ResponseFormatter_1.ResponseFormatter.conflict(res, 'A staff member with this email already exists');
    }
    const resolvedPosition = customPosition?.trim() || position?.trim() || undefined;
    const allUnits = [];
    if (businessUnit)
        allUnits.push(businessUnit);
    if (Array.isArray(additionalUnits)) {
        for (const u of additionalUnits) {
            if (u && !allUnits.includes(u))
                allUnits.push(u);
        }
    }
    const temporaryPassword = PasswordService_1.default.generateRandomPassword(12);
    const passwordHash = await PasswordService_1.default.hashPassword(temporaryPassword);
    const user = await User_model_1.User.create({
        firstName,
        lastName,
        email,
        phone,
        passwordHash,
        status: 'Active',
        emailVerified: true,
    });
    const assignedRoleCode = (0, PositionRoleMap_1.resolveRoleForPosition)(resolvedPosition);
    const staffRole = await Role_model_1.Role.findOne({ where: { code: assignedRoleCode } });
    if (staffRole) {
        await user.addRole(staffRole);
    }
    const staff = await Staff_model_1.Staff.create({
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
    });
    const dept = departmentId ? await Department_model_1.Department.findByPk(departmentId, { attributes: ['name'] }) : null;
    if (departmentId) {
        const secondaryIds = Array.isArray(additionalDepartmentIds)
            ? [...new Set(additionalDepartmentIds.map(Number).filter((id) => id && id !== Number(departmentId)))].slice(0, 2)
            : [];
        await StaffDepartment_model_1.StaffDepartment.bulkCreate([
            { staffId: staff.id, departmentId: BigInt(departmentId), isPrimary: true, assignedAt: new Date() },
            ...secondaryIds.map((id) => ({ staffId: staff.id, departmentId: BigInt(id), isPrimary: false, assignedAt: new Date() })),
        ], { ignoreDuplicates: true });
    }
    (0, CommunicationService_1.sendWelcomeEmail)({
        to: email,
        firstName,
        lastName,
        employeeId: staff.employeeId,
        temporaryPassword,
        position: resolvedPosition,
        businessUnit: businessUnit || undefined,
        department: dept?.name || undefined,
    }).catch(err => console.error('[Staff] Welcome email failed:', err));
    ResponseFormatter_1.ResponseFormatter.success(res, { ...staff.toJSON(), temporaryPassword }, 'Staff member created successfully', 201);
}));
router.patch('/:id', AuthMiddleware_1.default.requirePermission('org.staff.update.all', 'org.staff.update.own', 'org.staff.update.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    const departmentScoped = isDepartmentScopedOnly(req, 'org.staff.update.all', 'org.staff.update.own_department');
    if (departmentScoped && String(staff.departmentId) !== String(req.user?.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
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
    const updates = {};
    updatableFields.forEach(k => {
        if (req.body[k] !== undefined)
            updates[k] = req.body[k];
    });
    if (req.body.departmentId !== undefined && !departmentScoped)
        updates.departmentId = BigInt(req.body.departmentId);
    if (req.body.designationId !== undefined)
        updates.designationId = BigInt(req.body.designationId);
    if (req.body.locationId !== undefined)
        updates.locationId = BigInt(req.body.locationId);
    if (req.body.branchId !== undefined)
        updates.branchId = req.body.branchId ? BigInt(req.body.branchId) : null;
    if (req.body.unitId !== undefined)
        updates.unitId = req.body.unitId ? BigInt(req.body.unitId) : null;
    if (req.body.customPosition?.trim())
        updates.position = req.body.customPosition.trim();
    await staff.update(updates);
    if (updates.position !== undefined) {
        const targetRoleCode = (0, PositionRoleMap_1.resolveRoleForPosition)(updates.position);
        const targetRole = await Role_model_1.Role.findOne({ where: { code: targetRoleCode } });
        const staffUser = await User_model_1.User.findByPk(staff.userId);
        if (targetRole && staffUser) {
            const currentRoles = await staffUser.getRoles();
            const alreadyHasIt = currentRoles.some((r) => r.code === targetRoleCode);
            const isSuperAdmin = currentRoles.some((r) => r.code === 'superadmin');
            if (!alreadyHasIt && !isSuperAdmin) {
                const canonicalCodes = ['superadmin', 'admin', 'hr', 'hod', 'staff'];
                const toRemove = currentRoles.filter((r) => canonicalCodes.includes(r.code));
                if (toRemove.length)
                    await staffUser.removeRoles(toRemove);
                await staffUser.addRole(targetRole);
            }
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, staff.toJSON(), 'Staff member updated successfully');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('org.staff.delete.all', 'org.staff.delete.own_department'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    if (isDepartmentScopedOnly(req, 'org.staff.delete.all', 'org.staff.delete.own_department')
        && String(staff.departmentId) !== String(req.user?.departmentId)) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    }
    await staff.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Staff member deleted successfully');
}));
router.post('/:id/documents/upload', AuthMiddleware_1.default.requirePermission('org.staff.update.all', 'org.staff.update.own'), multer_1.upload.single('file'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    if (!req.file)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No file uploaded', 400);
    const { documentType } = req.body;
    const fileUrl = (0, multer_1.getFileUrl)(req.file.filename);
    const fieldMap = {
        id_card: 'idDocument',
        utility_bill: 'utilityBillDocument',
        certificate: 'certificateDocument',
        signature: 'signatureImage',
    };
    const field = fieldMap[documentType];
    if (!field) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Invalid documentType. Use: ${Object.keys(fieldMap).join(', ')}`, 400);
    }
    await staff.update({ [field]: fileUrl });
    ResponseFormatter_1.ResponseFormatter.success(res, {
        documentType,
        fileUrl,
        uploadedAt: new Date().toISOString(),
    }, 'Document uploaded successfully');
}));
router.get('/:id/departments', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [
            {
                model: Department_model_1.Department,
                as: 'departments',
                through: { attributes: ['isPrimary', 'assignedAt'] },
                attributes: ['id', 'uuid', 'code', 'name', 'status'],
                required: false,
            },
        ],
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, staff.departments || []);
}));
router.post('/:id/departments', AuthMiddleware_1.default.requirePermission('org.staff.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    const { departmentId, isPrimary } = req.body;
    if (!departmentId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'departmentId is required', 400);
    const dept = await Department_model_1.Department.findByPk(departmentId);
    if (!dept)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Department not found');
    if (isPrimary) {
        await StaffDepartment_model_1.StaffDepartment.update({ isPrimary: false }, { where: { staffId: staff.id } });
    }
    const [link, created] = await StaffDepartment_model_1.StaffDepartment.findOrCreate({
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
    ResponseFormatter_1.ResponseFormatter.success(res, link.toJSON(), created ? 'Department assigned' : 'Department assignment updated', created ? 201 : 200);
}));
router.delete('/:id/departments/:departmentId', AuthMiddleware_1.default.requirePermission('org.staff.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    const link = await StaffDepartment_model_1.StaffDepartment.findOne({
        where: {
            staffId: staff.id,
            departmentId: BigInt(req.params.departmentId),
        },
    });
    if (!link)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Department assignment not found');
    await link.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Staff removed from department');
}));
router.get('/:id/qualifications', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
router.get('/:id/skills', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
router.get('/:id/documents', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        attributes: ['idDocument', 'utilityBillDocument', 'certificateDocument', 'signatureImage'],
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    const docs = {
        idDocument: staff.idDocument || null,
        utilityBillDocument: staff.utilityBillDocument || null,
        certificateDocument: staff.certificateDocument || null,
        signatureImage: staff.signatureImage || null,
    };
    ResponseFormatter_1.ResponseFormatter.success(res, docs);
}));
exports.default = router;
//# sourceMappingURL=staff.routes.js.map