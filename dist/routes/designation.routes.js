"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Designation_model_1 = require("../models/Designation.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { departmentId, status } = req.query;
    const where = {};
    if (departmentId)
        where.departmentId = BigInt(departmentId);
    if (status)
        where.status = status;
    const designations = await Designation_model_1.Designation.findAll({
        where,
        order: [['level', 'ASC'], ['name', 'ASC']],
        attributes: ['id', 'name', 'code', 'departmentId', 'level', 'status'],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, designations);
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const d = await Designation_model_1.Designation.findByPk(req.params.id);
    if (!d)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Designation not found');
    ResponseFormatter_1.ResponseFormatter.success(res, d);
}));
router.post('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, code, departmentId, level, baseSalary, description } = req.body;
    const d = await Designation_model_1.Designation.create({
        name,
        code,
        departmentId: departmentId ? BigInt(departmentId) : undefined,
        level: level ?? 1,
        baseSalary,
        description,
        status: 'Active',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, d, 'Designation created', 201);
}));
router.patch('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const d = await Designation_model_1.Designation.findByPk(req.params.id);
    if (!d)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Designation not found');
    await d.update(req.body);
    ResponseFormatter_1.ResponseFormatter.success(res, d, 'Designation updated');
}));
router.delete('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const d = await Designation_model_1.Designation.findByPk(req.params.id);
    if (!d)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Designation not found');
    await d.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Designation deleted');
}));
exports.default = router;
//# sourceMappingURL=designation.routes.js.map