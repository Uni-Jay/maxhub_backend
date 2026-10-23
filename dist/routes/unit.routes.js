"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Unit_model_1 = require("../models/Unit.model");
const Branch_model_1 = require("../models/Branch.model");
const User_model_1 = require("../models/User.model");
const Staff_model_1 = require("../models/Staff.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', AuthMiddleware_1.default.requirePermission('org.unit.read.all', 'org.unit.read.own_branch'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const page = req.pagination?.page || 1;
    const limit = req.pagination?.limit || 20;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.branchId)
        where.branchId = BigInt(req.query.branchId);
    if (req.query.status)
        where.status = req.query.status;
    if (req.query.search) {
        const s = `%${req.query.search}%`;
        where[sequelize_1.Op.or] = [
            { name: { [sequelize_1.Op.iLike]: s } },
            { code: { [sequelize_1.Op.iLike]: s } },
        ];
    }
    const { count, rows } = await Unit_model_1.Unit.findAndCountAll({
        where,
        include: [
            { model: Branch_model_1.Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
            { model: User_model_1.User, as: 'head', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        ],
        limit,
        offset,
        order: [['name', 'ASC']],
        paranoid: true,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(r => r.toJSON()), count, page, limit);
}));
router.get('/:id', AuthMiddleware_1.default.requirePermission('org.unit.read.all', 'org.unit.read.own_branch'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const unit = await Unit_model_1.Unit.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
        include: [
            { model: Branch_model_1.Branch, as: 'branch', attributes: ['id', 'uuid', 'branchCode', 'branchName'], required: false },
            { model: User_model_1.User, as: 'head', attributes: ['id', 'firstName', 'lastName', 'email'], required: false },
        ],
    });
    if (!unit)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Unit not found');
    const staffCount = await Staff_model_1.Staff.count({ where: { unitId: unit.id } });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...unit.toJSON(), staffCount });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('org.unit.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, code, description, branchId, headUserId, status } = req.body;
    if (!name || !code) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'name and code are required', 400);
    }
    const unit = await Unit_model_1.Unit.create({
        uuid: (0, uuid_1.v4)(),
        name,
        code: code.toUpperCase(),
        description,
        branchId: branchId ? BigInt(branchId) : undefined,
        headUserId: headUserId ? BigInt(headUserId) : undefined,
        status: status || 'Active',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, unit.toJSON(), 'Unit created successfully', 201);
}));
router.patch('/:id', AuthMiddleware_1.default.requirePermission('org.unit.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const unit = await Unit_model_1.Unit.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!unit)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Unit not found');
    const allowed = ['name', 'code', 'description', 'branchId', 'headUserId', 'status'];
    const updates = {};
    allowed.forEach(k => {
        if (req.body[k] !== undefined)
            updates[k] = req.body[k];
    });
    await unit.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, unit.toJSON(), 'Unit updated successfully');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('org.unit.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const unit = await Unit_model_1.Unit.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!unit)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Unit not found');
    await unit.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Unit deleted successfully');
}));
exports.default = router;
//# sourceMappingURL=unit.routes.js.map