"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("../middleware/AuthMiddleware");
const PayrollPeriod_model_1 = require("../models/PayrollPeriod.model");
const EmployeeSalary_model_1 = require("../models/EmployeeSalary.model");
const SalaryStructure_model_1 = require("../models/SalaryStructure.model");
const Staff_model_1 = require("../models/Staff.model");
const router = (0, express_1.Router)();
function zeroDec(val) {
    return Number(val) || 0;
}
function buildPeriodCode(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}
router.get('/structures', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_VIEW'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status, departmentId, designationId } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (departmentId)
        where.departmentId = departmentId;
    if (designationId)
        where.designationId = designationId;
    const structures = await SalaryStructure_model_1.SalaryStructure.findAll({
        where,
        order: [['name', 'ASC']],
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, structures, 'Salary structures retrieved');
}));
router.post('/structures', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_MANAGE'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { code, name, description, departmentId, designationId, baseSalary, status, applicableFromDate, applicableToDate, } = req.body;
    if (!code || !name || baseSalary === undefined || !applicableFromDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'code, name, baseSalary, and applicableFromDate are required', 400);
    }
    const existing = await SalaryStructure_model_1.SalaryStructure.findOne({ where: { code } });
    if (existing) {
        return ResponseFormatter_1.ResponseFormatter.conflict(res, `Salary structure with code '${code}' already exists`);
    }
    const structure = await SalaryStructure_model_1.SalaryStructure.create({
        code,
        name,
        description,
        departmentId,
        designationId,
        baseSalary,
        status: status || 'Active',
        applicableFromDate,
        applicableToDate,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, structure, 'Salary structure created successfully', 201);
}));
router.put('/structures/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_MANAGE'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const structure = await SalaryStructure_model_1.SalaryStructure.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!structure) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Salary structure not found');
    }
    const { name, description, departmentId, designationId, baseSalary, status, applicableFromDate, applicableToDate, } = req.body;
    await structure.update({
        name: name ?? structure.name,
        description: description ?? structure.description,
        departmentId: departmentId ?? structure.departmentId,
        designationId: designationId ?? structure.designationId,
        baseSalary: baseSalary ?? structure.baseSalary,
        status: status ?? structure.status,
        applicableFromDate: applicableFromDate ?? structure.applicableFromDate,
        applicableToDate: applicableToDate ?? structure.applicableToDate,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, structure, 'Salary structure updated successfully');
}));
router.get('/periods', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_VIEW'), AuthMiddleware_1.AuthMiddleware.pagination, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const { status, year } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (year)
        where.year = parseInt(year);
    const { count, rows } = await PayrollPeriod_model_1.PayrollPeriod.findAndCountAll({
        where,
        limit,
        offset,
        order: [
            ['year', 'DESC'],
            ['month', 'DESC'],
        ],
    });
    return ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, page, limit, 'Payroll periods retrieved');
}));
router.post('/periods', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_MANAGE'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { month, year, startDate, endDate, salaryProcessDate, bankTransferDate, remarks, } = req.body;
    if (!month || !year || !startDate || !endDate || !salaryProcessDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'month, year, startDate, endDate, and salaryProcessDate are required', 400);
    }
    const m = parseInt(month);
    const y = parseInt(year);
    if (m < 1 || m > 12) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'month must be between 1 and 12', 400);
    }
    const periodCode = buildPeriodCode(y, m);
    const existing = await PayrollPeriod_model_1.PayrollPeriod.findOne({ where: { periodCode } });
    if (existing) {
        return ResponseFormatter_1.ResponseFormatter.conflict(res, `Payroll period '${periodCode}' already exists`);
    }
    const period = await PayrollPeriod_model_1.PayrollPeriod.create({
        periodCode,
        month: m,
        year: y,
        startDate,
        endDate,
        salaryProcessDate,
        bankTransferDate,
        status: 'Draft',
        remarks,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, period, 'Payroll period created successfully', 201);
}));
router.get('/periods/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_VIEW'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const period = await PayrollPeriod_model_1.PayrollPeriod.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!period) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Payroll period not found');
    }
    const salaryCounts = await EmployeeSalary_model_1.EmployeeSalary.findAll({
        attributes: [
            'status',
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('netSalary')), 'totalNet'],
        ],
        where: { payrollPeriodId: period.id },
        group: ['status'],
        raw: true,
    });
    const salaryStats = salaryCounts.reduce((acc, row) => {
        acc[row.status] = { count: Number(row.count), totalNet: Number(row.totalNet) || 0 };
        return acc;
    }, {});
    return ResponseFormatter_1.ResponseFormatter.success(res, { ...period.toJSON(), salaryStats }, 'Payroll period retrieved');
}));
router.patch('/periods/:id/status', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_MANAGE'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const validStatuses = ['Draft', 'Processing', 'Processed', 'Approved', 'Transferred', 'Closed'];
    if (!status || !validStatuses.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    const period = await PayrollPeriod_model_1.PayrollPeriod.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!period) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Payroll period not found');
    }
    const updatePayload = { status };
    if (status === 'Approved') {
        updatePayload.approvedBy = req.user.id;
        updatePayload.approvalDate = new Date();
    }
    if (remarks)
        updatePayload.remarks = remarks;
    await period.update(updatePayload);
    return ResponseFormatter_1.ResponseFormatter.success(res, period, `Payroll period status updated to '${status}'`);
}));
router.get('/periods/:id/salaries', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_VIEW'), AuthMiddleware_1.AuthMiddleware.pagination, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit, offset } = req.pagination;
    const { status } = req.query;
    const period = await PayrollPeriod_model_1.PayrollPeriod.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!period) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Payroll period not found');
    }
    const where = { payrollPeriodId: period.id };
    if (status)
        where.status = status;
    const { count, rows } = await EmployeeSalary_model_1.EmployeeSalary.findAndCountAll({
        where,
        include: [
            {
                model: Staff_model_1.Staff,
                as: 'staff',
                attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'departmentId', 'designationId'],
                required: false,
            },
        ],
        limit,
        offset,
        order: [['staffId', 'ASC']],
    });
    return ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, page, limit, 'Period salaries retrieved');
}));
router.post('/periods/:id/process', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_MANAGE'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const period = await PayrollPeriod_model_1.PayrollPeriod.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!period) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Payroll period not found');
    }
    if (period.status !== 'Draft') {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot process: payroll period is in '${period.status}' status. Only Draft periods can be processed.`, 400);
    }
    await period.update({ status: 'Processing', processedBy: req.user.id });
    const activeStaff = await Staff_model_1.Staff.findAll({
        where: { status: 'Active' },
    });
    if (activeStaff.length === 0) {
        await period.update({ status: 'Draft' });
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No active staff found to process payroll for', 400);
    }
    const activeStructures = await SalaryStructure_model_1.SalaryStructure.findAll({
        where: { status: 'Active' },
        order: [['applicableFromDate', 'DESC']],
    });
    const results = { created: 0, skipped: 0, errors: [] };
    for (const staff of activeStaff) {
        try {
            const existing = await EmployeeSalary_model_1.EmployeeSalary.findOne({
                where: { staffId: staff.id, payrollPeriodId: period.id },
            });
            if (existing) {
                results.skipped++;
                continue;
            }
            const matchedStructure = activeStructures.find((s) => s.designationId &&
                Number(s.designationId) === Number(staff.designationId) &&
                s.departmentId &&
                Number(s.departmentId) === Number(staff.departmentId)) ||
                activeStructures.find((s) => s.designationId && Number(s.designationId) === Number(staff.designationId)) ||
                activeStructures.find((s) => s.departmentId && Number(s.departmentId) === Number(staff.departmentId)) ||
                activeStructures.find((s) => !s.designationId && !s.departmentId);
            const baseSalary = matchedStructure ? Number(matchedStructure.baseSalary) : 0;
            const bonus = 0;
            const incomeTax = 0;
            const providentFund = 0;
            const healthInsurance = 0;
            const otherDeductions = 0;
            const advanceAmount = 0;
            const grossSalary = baseSalary + bonus;
            const totalDeductions = incomeTax + providentFund + healthInsurance + otherDeductions + advanceAmount;
            const netSalary = grossSalary - totalDeductions;
            const totalEarnings = grossSalary;
            await EmployeeSalary_model_1.EmployeeSalary.create({
                staffId: staff.id,
                payrollPeriodId: period.id,
                baseSalary,
                grossSalary,
                netSalary,
                totalEarnings,
                totalDeductions,
                incomeTax,
                providentFund,
                healthInsurance,
                otherDeductions,
                advanceAmount,
                bonus,
                status: 'Draft',
                processedOn: new Date(),
            });
            results.created++;
        }
        catch (err) {
            results.errors.push({
                staffId: String(staff.id),
                reason: err?.message ?? 'Unknown error',
            });
        }
    }
    const finalStatus = results.errors.length === 0 ? 'Processed' : 'Processing';
    await period.update({ status: finalStatus });
    return ResponseFormatter_1.ResponseFormatter.success(res, {
        periodCode: period.periodCode,
        status: finalStatus,
        summary: results,
    }, `Payroll processed: ${results.created} record(s) created, ${results.skipped} skipped, ${results.errors.length} error(s)`);
}));
router.get('/salaries', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_VIEW'), AuthMiddleware_1.AuthMiddleware.pagination, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const { status, staffId, periodId } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (staffId)
        where.staffId = staffId;
    if (periodId)
        where.payrollPeriodId = periodId;
    const { count, rows } = await EmployeeSalary_model_1.EmployeeSalary.findAndCountAll({
        where,
        include: [
            {
                model: Staff_model_1.Staff,
                as: 'staff',
                attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email'],
                required: false,
            },
            {
                model: PayrollPeriod_model_1.PayrollPeriod,
                as: 'payrollPeriod',
                attributes: ['id', 'periodCode', 'month', 'year', 'status'],
                required: false,
            },
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, page, limit, 'Salary records retrieved');
}));
router.get('/salaries/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_VIEW'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const salary = await EmployeeSalary_model_1.EmployeeSalary.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
        include: [
            {
                model: Staff_model_1.Staff,
                as: 'staff',
                attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'departmentId', 'designationId'],
                required: false,
            },
            {
                model: PayrollPeriod_model_1.PayrollPeriod,
                as: 'payrollPeriod',
                attributes: ['id', 'periodCode', 'month', 'year', 'status'],
                required: false,
            },
        ],
    });
    if (!salary) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Salary record not found');
    }
    return ResponseFormatter_1.ResponseFormatter.success(res, salary, 'Salary record retrieved');
}));
router.patch('/salaries/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_MANAGE'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const salary = await EmployeeSalary_model_1.EmployeeSalary.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!salary) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Salary record not found');
    }
    if (salary.status === 'Paid') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Cannot modify a salary record that has already been paid', 400);
    }
    const { baseSalary, bonus, incomeTax, providentFund, healthInsurance, otherDeductions, advanceAmount, bankAccountNumber, remarks, } = req.body;
    const newBase = baseSalary !== undefined ? Number(baseSalary) : zeroDec(salary.baseSalary);
    const newBonus = bonus !== undefined ? Number(bonus) : zeroDec(salary.bonus);
    const newIncomeTax = incomeTax !== undefined ? Number(incomeTax) : zeroDec(salary.incomeTax);
    const newPF = providentFund !== undefined ? Number(providentFund) : zeroDec(salary.providentFund);
    const newHealth = healthInsurance !== undefined ? Number(healthInsurance) : zeroDec(salary.healthInsurance);
    const newOtherDed = otherDeductions !== undefined ? Number(otherDeductions) : zeroDec(salary.otherDeductions);
    const newAdvance = advanceAmount !== undefined ? Number(advanceAmount) : zeroDec(salary.advanceAmount);
    const newGross = newBase + newBonus;
    const newTotalDeductions = newIncomeTax + newPF + newHealth + newOtherDed + newAdvance;
    const newNet = newGross - newTotalDeductions;
    await salary.update({
        baseSalary: newBase,
        bonus: newBonus,
        incomeTax: newIncomeTax,
        providentFund: newPF,
        healthInsurance: newHealth,
        otherDeductions: newOtherDed,
        advanceAmount: newAdvance,
        grossSalary: newGross,
        totalDeductions: newTotalDeductions,
        netSalary: newNet,
        totalEarnings: newGross,
        bankAccountNumber: bankAccountNumber ?? salary.bankAccountNumber,
        remarks: remarks ?? salary.remarks,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, salary, 'Salary record updated successfully');
}));
router.patch('/salaries/:id/status', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_MANAGE'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const validStatuses = ['Draft', 'Approved', 'Processed', 'Paid', 'OnHold'];
    if (!status || !validStatuses.includes(status)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    const salary = await EmployeeSalary_model_1.EmployeeSalary.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!salary) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Salary record not found');
    }
    const updatePayload = { status };
    if (status === 'Paid') {
        updatePayload.paidOn = new Date();
    }
    if (status === 'Processed') {
        updatePayload.processedOn = new Date();
    }
    if (remarks)
        updatePayload.remarks = remarks;
    await salary.update(updatePayload);
    return ResponseFormatter_1.ResponseFormatter.success(res, salary, `Salary status updated to '${status}'`);
}));
const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
router.get('/my-slips', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const staff = await Staff_model_1.Staff.findOne({ where: { userId } });
    if (!staff) {
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No payslips found');
    }
    const salaries = await EmployeeSalary_model_1.EmployeeSalary.findAll({
        where: {
            staffId: staff.id,
            status: { [sequelize_1.Op.in]: ['Paid', 'Approved', 'Processed', 'Draft'] },
        },
        include: [
            {
                model: PayrollPeriod_model_1.PayrollPeriod,
                as: 'payrollPeriod',
                attributes: ['id', 'periodCode', 'month', 'year', 'bankTransferDate', 'salaryProcessDate'],
                required: false,
            },
        ],
        order: [
            [{ model: PayrollPeriod_model_1.PayrollPeriod, as: 'payrollPeriod' }, 'year', 'DESC'],
            [{ model: PayrollPeriod_model_1.PayrollPeriod, as: 'payrollPeriod' }, 'month', 'DESC'],
        ],
    });
    const slips = salaries.map((s) => {
        const period = s.payrollPeriod;
        const month = period?.month ?? 0;
        const year = period?.year ?? new Date().getFullYear();
        return {
            id: Number(s.id),
            salaryCode: `SAL-${String(s.id).padStart(6, '0')}`,
            periodName: period ? `${MONTH_NAMES[month]} ${year}` : s.uuid,
            baseSalary: Number(s.baseSalary) || 0,
            bonus: Number(s.bonus) || 0,
            grossSalary: Number(s.grossSalary) || 0,
            incomeTax: Number(s.incomeTax) || 0,
            providentFund: Number(s.providentFund) || 0,
            healthInsurance: Number(s.healthInsurance) || 0,
            otherDeductions: Number(s.otherDeductions) || 0,
            totalDeductions: Number(s.totalDeductions) || 0,
            netSalary: Number(s.netSalary) || 0,
            status: s.status,
            payDate: (s.paidOn ?? period?.bankTransferDate ?? s.processedOn ?? s.updatedAt)?.toISOString?.() ?? '',
        };
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, slips, 'Payslips retrieved');
}));
router.get('/stats/overview', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('PAYROLL_VIEW'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentPeriod = await PayrollPeriod_model_1.PayrollPeriod.findOne({
        where: { month: currentMonth, year: currentYear },
    });
    let monthlySalaryStats = { headcount: 0, totalGross: 0, totalNet: 0, totalDeductions: 0, avgNet: 0 };
    if (currentPeriod) {
        const agg = await EmployeeSalary_model_1.EmployeeSalary.findOne({
            attributes: [
                [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'headcount'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('grossSalary')), 'totalGross'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('netSalary')), 'totalNet'],
                [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('totalDeductions')), 'totalDeductions'],
                [(0, sequelize_1.fn)('AVG', (0, sequelize_1.col)('netSalary')), 'avgNet'],
            ],
            where: {
                payrollPeriodId: currentPeriod.id,
                status: { [sequelize_1.Op.notIn]: ['OnHold'] },
            },
            raw: true,
        });
        if (agg) {
            monthlySalaryStats = {
                headcount: Number(agg.headcount) || 0,
                totalGross: Number(agg.totalGross) || 0,
                totalNet: Number(agg.totalNet) || 0,
                totalDeductions: Number(agg.totalDeductions) || 0,
                avgNet: Number(agg.avgNet) || 0,
            };
        }
    }
    const activeStaffCount = await Staff_model_1.Staff.count({ where: { status: 'Active' } });
    const ytdAgg = await EmployeeSalary_model_1.EmployeeSalary.findOne({
        attributes: [
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('netSalary')), 'ytdNet'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('grossSalary')), 'ytdGross'],
        ],
        where: {
            status: { [sequelize_1.Op.in]: ['Paid', 'Processed', 'Approved'] },
        },
        include: [
            {
                model: PayrollPeriod_model_1.PayrollPeriod,
                as: 'payrollPeriod',
                attributes: [],
                where: { year: currentYear },
                required: true,
            },
        ],
        raw: true,
    });
    const ytdStats = {
        ytdNet: Number(ytdAgg?.ytdNet) || 0,
        ytdGross: Number(ytdAgg?.ytdGross) || 0,
    };
    const statusBreakdown = await EmployeeSalary_model_1.EmployeeSalary.findAll({
        attributes: [
            'status',
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
        ],
        group: ['status'],
        raw: true,
    });
    const statusSummary = {};
    for (const row of statusBreakdown) {
        statusSummary[row.status] = Number(row.count);
    }
    return ResponseFormatter_1.ResponseFormatter.success(res, {
        currentPeriod: currentPeriod
            ? { id: currentPeriod.id, periodCode: currentPeriod.periodCode, status: currentPeriod.status }
            : null,
        currentMonth: monthlySalaryStats,
        activeHeadcount: activeStaffCount,
        yearToDate: ytdStats,
        statusSummary,
    }, 'Payroll overview retrieved');
}));
exports.default = router;
//# sourceMappingURL=payroll.routes.js.map