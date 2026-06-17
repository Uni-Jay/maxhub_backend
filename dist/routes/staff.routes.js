"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
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
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.status)
        where.status = req.query.status;
    if (req.query.departmentId)
        where.departmentId = BigInt(req.query.departmentId);
    if (req.query.branchId)
        where.branchId = BigInt(req.query.branchId);
    if (req.query.unitId)
        where.unitId = BigInt(req.query.unitId);
    if (req.query.search) {
        const s = `%${req.query.search}%`;
        where[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.iLike]: s } },
            { lastName: { [sequelize_1.Op.iLike]: s } },
            { email: { [sequelize_1.Op.iLike]: s } },
            { employeeId: { [sequelize_1.Op.iLike]: s } },
        ];
    }
    const { count, rows } = await Staff_model_1.Staff.findAndCountAll({
        where,
        include: [
            { model: Department_model_1.Department, attributes: ['id', 'name', 'code'], required: false },
            { model: Designation_model_1.Designation, attributes: ['id', 'name'], required: false },
            { model: Branch_model_1.Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
            { model: Unit_model_1.Unit, as: 'unit', attributes: ['id', 'uuid', 'code', 'name'], required: false },
        ],
        limit,
        offset,
        order: [[req.sort?.field || 'createdAt', req.sort?.order || 'DESC']],
        paranoid: true,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
        include: [
            { model: Department_model_1.Department, attributes: ['id', 'name', 'code'] },
            { model: Designation_model_1.Designation, attributes: ['id', 'name'] },
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
    ResponseFormatter_1.ResponseFormatter.success(res, staff.toJSON());
}));
router.post('/', AuthMiddleware_1.default.requirePermission('org.staff.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, employeeId, departmentId, designationId, locationId, joiningDate, dateOfBirth, gender, alternatePhone, whatsappNumber, socialMediaHandle, homeAddress, position, customPosition, businessUnit, additionalUnits, branchId, unitId, jobTitle, hireDate, employmentStatus, educationLevel, degree, institution, major, graduationYear, nyscCompleted, emergencyContactName, emergencyContactPhone, emergencyRelationship, emergencyHomeAddress, emergencyOfficeAddress, validIdType, validIdNumber, hasCertification, certifications, previousWorkHistory, skills, guarantor1Name, guarantor1Relationship, guarantor1Phone, guarantor1Address, guarantor1Email, guarantor1Occupation, guarantor1DurationKnown, guarantor2Name, guarantor2Relationship, guarantor2Phone, guarantor2Address, guarantor2Email, guarantor2Occupation, guarantor2DurationKnown, bankName, accountType, accountName, accountNumber, hasMedicalCondition, medicalConditions, medications, readJobDescription, acceptedCompanyPolicy, receivedCompanyAssets, assignedAssets, bloodGroup, maritalStatus, nationality, } = req.body;
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
    const staffRole = await Role_model_1.Role.findOne({ where: { code: 'staff' } });
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
    });
    const dept = departmentId ? await Department_model_1.Department.findByPk(departmentId, { attributes: ['name'] }) : null;
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
router.patch('/:id', AuthMiddleware_1.default.requirePermission('org.staff.update.all', 'org.staff.update.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
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
    const updates = {};
    updatableFields.forEach(k => {
        if (req.body[k] !== undefined)
            updates[k] = req.body[k];
    });
    if (req.body.departmentId !== undefined)
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
    ResponseFormatter_1.ResponseFormatter.success(res, staff.toJSON(), 'Staff member updated successfully');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('org.staff.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    await staff.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Staff member deleted successfully');
}));
router.post('/:id/documents/upload', AuthMiddleware_1.default.requirePermission('org.staff.update.all', 'org.staff.update.own'), multer_1.upload.single('file'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
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
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
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
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
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
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
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
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
router.get('/:id/skills', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
router.get('/:id/documents', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
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