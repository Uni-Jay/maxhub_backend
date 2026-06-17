"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const Staff_model_1 = require("../models/Staff.model");
const Department_model_1 = require("../models/Department.model");
const Designation_model_1 = require("../models/Designation.model");
const User_model_1 = require("../models/User.model");
const Role_model_1 = require("../models/Role.model");
const PasswordService_1 = __importDefault(require("../services/PasswordService"));
const CommunicationService_1 = require("../services/CommunicationService");
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
    if (req.query.search) {
        const s = `%${req.query.search}%`;
        where[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.like]: s } },
            { lastName: { [sequelize_1.Op.like]: s } },
            { email: { [sequelize_1.Op.like]: s } },
            { employeeId: { [sequelize_1.Op.like]: s } },
        ];
    }
    const { count, rows } = await Staff_model_1.Staff.findAndCountAll({
        where,
        include: [
            { model: Department_model_1.Department, attributes: ['id', 'name', 'code'], required: false },
            { model: Designation_model_1.Designation, attributes: ['id', 'title'], required: false },
        ],
        limit,
        offset,
        order: [[req.sort?.field || 'createdAt', req.sort?.order || 'DESC']],
        paranoid: true,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findByPk(req.params.id, {
        include: [
            { model: Department_model_1.Department, attributes: ['id', 'name', 'code'] },
            { model: Designation_model_1.Designation, attributes: ['id', 'title'] },
        ],
    });
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, staff.toJSON());
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, employeeId, departmentId, designationId, locationId, joiningDate, dateOfBirth, gender, alternatePhone, position, customPosition, businessUnit, additionalUnits, } = req.body;
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
    const resolvedEmployeeId = employeeId || `EMP${Date.now()}`;
    const staff = await Staff_model_1.Staff.create({
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
    });
    const dept = departmentId ? await Department_model_1.Department.findByPk(departmentId, { attributes: ['name'] }) : null;
    (0, CommunicationService_1.sendWelcomeEmail)({
        to: email,
        firstName,
        lastName,
        employeeId: resolvedEmployeeId,
        temporaryPassword,
        position: resolvedPosition,
        businessUnit: businessUnit || undefined,
        department: dept?.name || undefined,
    }).catch(err => console.error('[Staff] Welcome email failed:', err));
    ResponseFormatter_1.ResponseFormatter.success(res, staff.toJSON(), 'Staff member created successfully', 201);
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findByPk(req.params.id);
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    const { firstName, lastName, phone, status, departmentId, designationId, alternatePhone, emergencyContactName, emergencyContactPhone, position, customPosition, businessUnit, additionalUnits, } = req.body;
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
    });
    ResponseFormatter_1.ResponseFormatter.success(res, staff.toJSON(), 'Staff member updated successfully');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findByPk(req.params.id);
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    await staff.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Staff member deleted successfully');
}));
router.get('/:id/qualifications', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findByPk(req.params.id);
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
router.get('/:id/skills', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findByPk(req.params.id);
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
router.get('/:id/documents', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const staff = await Staff_model_1.Staff.findByPk(req.params.id);
    if (!staff)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Staff member not found');
    ResponseFormatter_1.ResponseFormatter.success(res, []);
}));
exports.default = router;
//# sourceMappingURL=staff.routes.js.map