"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Department_model_1 = require("../models/Department.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where = {};
    if (status)
        where.status = status;
    const departments = await Department_model_1.Department.findAll({
        where,
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'code', 'status', 'parentDepartmentId'],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, departments);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const dept = await Department_model_1.Department.findByPk(req.params.id);
    if (!dept)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Department not found');
    ResponseFormatter_1.ResponseFormatter.success(res, dept);
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, code, parentDepartmentId, headUserId } = req.body;
    const dept = await Department_model_1.Department.create({
        name,
        code: code ?? name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
        parentDepartmentId: parentDepartmentId ? BigInt(parentDepartmentId) : undefined,
        headUserId: headUserId ? BigInt(headUserId) : undefined,
        status: 'Active',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, dept, 'Department created', 201);
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const dept = await Department_model_1.Department.findByPk(req.params.id);
    if (!dept)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Department not found');
    await dept.update(req.body);
    ResponseFormatter_1.ResponseFormatter.success(res, dept, 'Department updated');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const dept = await Department_model_1.Department.findByPk(req.params.id);
    if (!dept)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Department not found');
    await dept.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Department deleted');
}));
exports.default = router;
//# sourceMappingURL=department.routes.js.map