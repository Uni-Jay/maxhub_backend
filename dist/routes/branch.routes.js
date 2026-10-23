"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Branch_model_1 = require("../models/Branch.model");
const User_model_1 = require("../models/User.model");
const Department_model_1 = require("../models/Department.model");
const Unit_model_1 = require("../models/Unit.model");
const Staff_model_1 = require("../models/Staff.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', AuthMiddleware_1.default.requirePermission('org.branch.read.all', 'org.branch.read.own_branch'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.status)
        where.status = req.query.status;
    if (req.query.search) {
        const s = `%${req.query.search}%`;
        where[sequelize_1.Op.or] = [
            { branchName: { [sequelize_1.Op.iLike]: s } },
            { branchCode: { [sequelize_1.Op.iLike]: s } },
            { city: { [sequelize_1.Op.iLike]: s } },
        ];
    }
    const { count, rows } = await Branch_model_1.Branch.findAndCountAll({
        where,
        include: [
            { model: User_model_1.User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        ],
        limit,
        offset,
        order: [['branchName', 'ASC']],
        paranoid: true,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
}));
router.get('/:id', AuthMiddleware_1.default.requirePermission('org.branch.read.all', 'org.branch.read.own_branch'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const branch = await Branch_model_1.Branch.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [
            { model: User_model_1.User, as: 'manager', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
            { model: Department_model_1.Department, as: 'departments', attributes: ['id', 'uuid', 'code', 'name', 'status'], required: false },
            { model: Unit_model_1.Unit, as: 'units', attributes: ['id', 'uuid', 'code', 'name', 'status'], required: false },
        ],
    });
    if (!branch)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Branch not found');
    const staffCount = await Staff_model_1.Staff.count({ where: { branchId: branch.id } });
    const result = { ...branch.toJSON(), staffCount };
    ResponseFormatter_1.ResponseFormatter.success(res, result);
}));
router.post('/', AuthMiddleware_1.default.requirePermission('org.branch.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { branchCode, branchName, country, state, city, address, phone, email, managerId, status } = req.body;
    if (!branchCode || !branchName) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'branchCode and branchName are required', 400);
    }
    const existing = await Branch_model_1.Branch.findOne({ where: { branchCode } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Branch code already exists', 409);
    const branch = await Branch_model_1.Branch.create({
        uuid: (0, uuid_1.v4)(),
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
    ResponseFormatter_1.ResponseFormatter.success(res, branch.toJSON(), 'Branch created successfully', 201);
}));
router.patch('/:id', AuthMiddleware_1.default.requirePermission('org.branch.update.all', 'org.branch.update.own_branch'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const branch = await Branch_model_1.Branch.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!branch)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Branch not found');
    const allowed = ['branchName', 'country', 'state', 'city', 'address', 'phone', 'email', 'managerId', 'status'];
    const updates = {};
    allowed.forEach(k => {
        if (req.body[k] !== undefined)
            updates[k] = req.body[k];
    });
    await branch.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, branch.toJSON(), 'Branch updated successfully');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('org.branch.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const branch = await Branch_model_1.Branch.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!branch)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Branch not found');
    await branch.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Branch deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=branch.routes.js.map