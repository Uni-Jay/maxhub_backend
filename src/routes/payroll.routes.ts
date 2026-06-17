import { Router, Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { PayrollPeriod } from '@models/PayrollPeriod.model';
import { EmployeeSalary } from '@models/EmployeeSalary.model';
import { SalaryStructure } from '@models/SalaryStructure.model';
import { Staff } from '@models/Staff.model';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function zeroDec(val: any): number {
  return Number(val) || 0;
}

function buildPeriodCode(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// ════════════════════════════════════════════════════════════════════════════
// SALARY STRUCTURE ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /payroll/structures ──────────────────────────────────────────────────
router.get(
  '/structures',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_VIEW'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { status, departmentId, designationId } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (status)        where.status        = status;
    if (departmentId)  where.departmentId  = departmentId;
    if (designationId) where.designationId = designationId;

    const structures = await SalaryStructure.findAll({
      where,
      order: [['name', 'ASC']],
    });

    return ResponseFormatter.success(res, structures, 'Salary structures retrieved');
  })
);

// ─── POST /payroll/structures ─────────────────────────────────────────────────
router.post(
  '/structures',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_MANAGE'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      code, name, description, departmentId, designationId,
      baseSalary, status, applicableFromDate, applicableToDate,
    } = req.body;

    if (!code || !name || baseSalary === undefined || !applicableFromDate) {
      return ResponseFormatter.error(
        res,
        'code, name, baseSalary, and applicableFromDate are required',
        400
      );
    }

    const existing = await SalaryStructure.findOne({ where: { code } });
    if (existing) {
      return ResponseFormatter.conflict(res, `Salary structure with code '${code}' already exists`);
    }

    const structure = await SalaryStructure.create({
      code,
      name,
      description,
      departmentId,
      designationId,
      baseSalary,
      status:              status || 'Active',
      applicableFromDate,
      applicableToDate,
    });

    return ResponseFormatter.success(res, structure, 'Salary structure created successfully', 201);
  })
);

// ─── PUT /payroll/structures/:id ──────────────────────────────────────────────
router.put(
  '/structures/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_MANAGE'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const structure = await SalaryStructure.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!structure) {
      return ResponseFormatter.notFound(res, 'Salary structure not found');
    }

    const {
      name, description, departmentId, designationId,
      baseSalary, status, applicableFromDate, applicableToDate,
    } = req.body;

    await structure.update({
      name:               name               ?? structure.name,
      description:        description        ?? structure.description,
      departmentId:       departmentId       ?? structure.departmentId,
      designationId:      designationId      ?? structure.designationId,
      baseSalary:         baseSalary         ?? structure.baseSalary,
      status:             status             ?? structure.status,
      applicableFromDate: applicableFromDate ?? structure.applicableFromDate,
      applicableToDate:   applicableToDate   ?? structure.applicableToDate,
    });

    return ResponseFormatter.success(res, structure, 'Salary structure updated successfully');
  })
);

// ════════════════════════════════════════════════════════════════════════════
// PAYROLL PERIOD ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /payroll/periods ─────────────────────────────────────────────────────
router.get(
  '/periods',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_VIEW'),
  AuthMiddleware.pagination,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = req.pagination!;
    const { status, year } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (year)   where.year   = parseInt(year);

    const { count, rows } = await PayrollPeriod.findAndCountAll({
      where,
      limit,
      offset,
      order: [
        ['year',  'DESC'],
        ['month', 'DESC'],
      ],
    });

    return ResponseFormatter.paginated(res, rows, count, page, limit, 'Payroll periods retrieved');
  })
);

// ─── POST /payroll/periods ────────────────────────────────────────────────────
router.post(
  '/periods',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_MANAGE'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      month, year, startDate, endDate,
      salaryProcessDate, bankTransferDate, remarks,
    } = req.body;

    if (!month || !year || !startDate || !endDate || !salaryProcessDate) {
      return ResponseFormatter.error(
        res,
        'month, year, startDate, endDate, and salaryProcessDate are required',
        400
      );
    }

    const m = parseInt(month);
    const y = parseInt(year);

    if (m < 1 || m > 12) {
      return ResponseFormatter.error(res, 'month must be between 1 and 12', 400);
    }

    const periodCode = buildPeriodCode(y, m);

    const existing = await PayrollPeriod.findOne({ where: { periodCode } });
    if (existing) {
      return ResponseFormatter.conflict(res, `Payroll period '${periodCode}' already exists`);
    }

    const period = await PayrollPeriod.create({
      periodCode,
      month: m,
      year:  y,
      startDate,
      endDate,
      salaryProcessDate,
      bankTransferDate,
      status: 'Draft',
      remarks,
    });

    return ResponseFormatter.success(res, period, 'Payroll period created successfully', 201);
  })
);

// ─── GET /payroll/periods/:id ─────────────────────────────────────────────────
router.get(
  '/periods/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_VIEW'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const period = await PayrollPeriod.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!period) {
      return ResponseFormatter.notFound(res, 'Payroll period not found');
    }

    // Attach summary counts
    const salaryCounts = await EmployeeSalary.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('netSalary')), 'totalNet'],
      ],
      where: { payrollPeriodId: period.id },
      group: ['status'],
      raw: true,
    }) as any[];

    const salaryStats = salaryCounts.reduce(
      (acc: Record<string, any>, row: any) => {
        acc[row.status] = { count: Number(row.count), totalNet: Number(row.totalNet) || 0 };
        return acc;
      },
      {}
    );

    return ResponseFormatter.success(
      res,
      { ...period.toJSON(), salaryStats },
      'Payroll period retrieved'
    );
  })
);

// ─── PATCH /payroll/periods/:id/status ───────────────────────────────────────
router.patch(
  '/periods/:id/status',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_MANAGE'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ['Draft', 'Processing', 'Processed', 'Approved', 'Transferred', 'Closed'];

    if (!status || !validStatuses.includes(status)) {
      return ResponseFormatter.error(
        res,
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    const period = await PayrollPeriod.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!period) {
      return ResponseFormatter.notFound(res, 'Payroll period not found');
    }

    const updatePayload: Record<string, any> = { status };

    if (status === 'Approved') {
      updatePayload.approvedBy   = req.user!.id;
      updatePayload.approvalDate = new Date();
    }

    if (remarks) updatePayload.remarks = remarks;

    await period.update(updatePayload);

    return ResponseFormatter.success(res, period, `Payroll period status updated to '${status}'`);
  })
);

// ─── GET /payroll/periods/:id/salaries ────────────────────────────────────────
router.get(
  '/periods/:id/salaries',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_VIEW'),
  AuthMiddleware.pagination,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { page, limit, offset } = req.pagination!;
    const { status } = req.query as Record<string, string>;

    const period = await PayrollPeriod.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!period) {
      return ResponseFormatter.notFound(res, 'Payroll period not found');
    }

    const where: Record<string, any> = { payrollPeriodId: period.id };
    if (status) where.status = status;

    const { count, rows } = await EmployeeSalary.findAndCountAll({
      where,
      include: [
        {
          model:      Staff,
          as:         'staff',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'departmentId', 'designationId'],
          required:   false,
        },
      ],
      limit,
      offset,
      order: [['staffId', 'ASC']],
    });

    return ResponseFormatter.paginated(res, rows, count, page, limit, 'Period salaries retrieved');
  })
);

// ─── POST /payroll/periods/:id/process ────────────────────────────────────────
router.post(
  '/periods/:id/process',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_MANAGE'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const period = await PayrollPeriod.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!period) {
      return ResponseFormatter.notFound(res, 'Payroll period not found');
    }

    if (period.status !== 'Draft') {
      return ResponseFormatter.error(
        res,
        `Cannot process: payroll period is in '${period.status}' status. Only Draft periods can be processed.`,
        400
      );
    }

    // Set period to Processing immediately
    await period.update({ status: 'Processing', processedBy: req.user!.id as any });

    // Fetch all active staff
    const activeStaff = await Staff.findAll({
      where: { status: 'Active' },
    });

    if (activeStaff.length === 0) {
      await period.update({ status: 'Draft' });
      return ResponseFormatter.error(res, 'No active staff found to process payroll for', 400);
    }

    // Fetch best-match salary structures (active, most recent from date)
    const activeStructures = await SalaryStructure.findAll({
      where: { status: 'Active' },
      order: [['applicableFromDate', 'DESC']],
    });

    const results: {
      created: number;
      skipped: number;
      errors: Array<{ staffId: string | number; reason: string }>;
    } = { created: 0, skipped: 0, errors: [] };

    for (const staff of activeStaff) {
      try {
        // Skip if salary record already exists for this period
        const existing = await EmployeeSalary.findOne({
          where: { staffId: staff.id, payrollPeriodId: period.id },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Match salary structure: prefer designation > department > generic
        const matchedStructure =
          activeStructures.find(
            (s) =>
              s.designationId &&
              Number(s.designationId) === Number(staff.designationId) &&
              s.departmentId &&
              Number(s.departmentId) === Number(staff.departmentId)
          ) ||
          activeStructures.find(
            (s) => s.designationId && Number(s.designationId) === Number(staff.designationId)
          ) ||
          activeStructures.find(
            (s) => s.departmentId && Number(s.departmentId) === Number(staff.departmentId)
          ) ||
          activeStructures.find((s) => !s.designationId && !s.departmentId);

        // Use structure baseSalary or fall back to 0 (requires manual correction)
        const baseSalary = matchedStructure ? Number(matchedStructure.baseSalary) : 0;

        // Salary computation placeholders (no external bonus/deduction data at this stage)
        const bonus            = 0;
        const incomeTax        = 0;
        const providentFund    = 0;
        const healthInsurance  = 0;
        const otherDeductions  = 0;
        const advanceAmount    = 0;

        const grossSalary     = baseSalary + bonus;
        const totalDeductions = incomeTax + providentFund + healthInsurance + otherDeductions + advanceAmount;
        const netSalary       = grossSalary - totalDeductions;
        const totalEarnings   = grossSalary;

        await EmployeeSalary.create({
          staffId:        staff.id,
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
          status:      'Draft',
          processedOn: new Date(),
        });

        results.created++;
      } catch (err: any) {
        results.errors.push({
          staffId: String(staff.id),
          reason:  err?.message ?? 'Unknown error',
        });
      }
    }

    // Transition period to Processed if there were no hard errors
    const finalStatus = results.errors.length === 0 ? 'Processed' : 'Processing';
    await period.update({ status: finalStatus });

    return ResponseFormatter.success(
      res,
      {
        periodCode: period.periodCode,
        status:     finalStatus,
        summary:    results,
      },
      `Payroll processed: ${results.created} record(s) created, ${results.skipped} skipped, ${results.errors.length} error(s)`
    );
  })
);

// ════════════════════════════════════════════════════════════════════════════
// INDIVIDUAL SALARY ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /payroll/salaries ────────────────────────────────────────────────────
router.get(
  '/salaries',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_VIEW'),
  AuthMiddleware.pagination,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = req.pagination!;
    const { status, staffId, periodId } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (status)   where.status          = status;
    if (staffId)  where.staffId         = staffId;
    if (periodId) where.payrollPeriodId = periodId;

    const { count, rows } = await EmployeeSalary.findAndCountAll({
      where,
      include: [
        {
          model:      Staff,
          as:         'staff',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email'],
          required:   false,
        },
        {
          model:      PayrollPeriod,
          as:         'payrollPeriod',
          attributes: ['id', 'periodCode', 'month', 'year', 'status'],
          required:   false,
        },
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return ResponseFormatter.paginated(res, rows, count, page, limit, 'Salary records retrieved');
  })
);

// ─── GET /payroll/salaries/:id ────────────────────────────────────────────────
router.get(
  '/salaries/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_VIEW'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const salary = await EmployeeSalary.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
      include: [
        {
          model:      Staff,
          as:         'staff',
          attributes: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'departmentId', 'designationId'],
          required:   false,
        },
        {
          model:      PayrollPeriod,
          as:         'payrollPeriod',
          attributes: ['id', 'periodCode', 'month', 'year', 'status'],
          required:   false,
        },
      ],
    });

    if (!salary) {
      return ResponseFormatter.notFound(res, 'Salary record not found');
    }

    return ResponseFormatter.success(res, salary, 'Salary record retrieved');
  })
);

// ─── PATCH /payroll/salaries/:id ─────────────────────────────────────────────
router.patch(
  '/salaries/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_MANAGE'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const salary = await EmployeeSalary.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!salary) {
      return ResponseFormatter.notFound(res, 'Salary record not found');
    }

    if (salary.status === 'Paid') {
      return ResponseFormatter.error(res, 'Cannot modify a salary record that has already been paid', 400);
    }

    const {
      baseSalary, bonus,
      incomeTax, providentFund, healthInsurance, otherDeductions, advanceAmount,
      bankAccountNumber, remarks,
    } = req.body;

    // Recompute derived fields when components are changed
    const newBase           = baseSalary       !== undefined ? Number(baseSalary)       : zeroDec(salary.baseSalary);
    const newBonus          = bonus             !== undefined ? Number(bonus)             : zeroDec(salary.bonus);
    const newIncomeTax      = incomeTax         !== undefined ? Number(incomeTax)         : zeroDec(salary.incomeTax);
    const newPF             = providentFund     !== undefined ? Number(providentFund)     : zeroDec(salary.providentFund);
    const newHealth         = healthInsurance   !== undefined ? Number(healthInsurance)   : zeroDec(salary.healthInsurance);
    const newOtherDed       = otherDeductions   !== undefined ? Number(otherDeductions)   : zeroDec(salary.otherDeductions);
    const newAdvance        = advanceAmount     !== undefined ? Number(advanceAmount)     : zeroDec(salary.advanceAmount);

    const newGross          = newBase + newBonus;
    const newTotalDeductions = newIncomeTax + newPF + newHealth + newOtherDed + newAdvance;
    const newNet            = newGross - newTotalDeductions;

    await salary.update({
      baseSalary:       newBase,
      bonus:            newBonus,
      incomeTax:        newIncomeTax,
      providentFund:    newPF,
      healthInsurance:  newHealth,
      otherDeductions:  newOtherDed,
      advanceAmount:    newAdvance,
      grossSalary:      newGross,
      totalDeductions:  newTotalDeductions,
      netSalary:        newNet,
      totalEarnings:    newGross,
      bankAccountNumber: bankAccountNumber ?? salary.bankAccountNumber,
      remarks:           remarks           ?? salary.remarks,
    });

    return ResponseFormatter.success(res, salary, 'Salary record updated successfully');
  })
);

// ─── PATCH /payroll/salaries/:id/status ───────────────────────────────────────
router.patch(
  '/salaries/:id/status',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_MANAGE'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ['Draft', 'Approved', 'Processed', 'Paid', 'OnHold'];

    if (!status || !validStatuses.includes(status)) {
      return ResponseFormatter.error(
        res,
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    const salary = await EmployeeSalary.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!salary) {
      return ResponseFormatter.notFound(res, 'Salary record not found');
    }

    const updatePayload: Record<string, any> = { status };

    if (status === 'Paid') {
      updatePayload.paidOn = new Date();
    }

    if (status === 'Processed') {
      updatePayload.processedOn = new Date();
    }

    if (remarks) updatePayload.remarks = remarks;

    await salary.update(updatePayload);

    return ResponseFormatter.success(res, salary, `Salary status updated to '${status}'`);
  })
);

// ════════════════════════════════════════════════════════════════════════════
// STATS / OVERVIEW
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /payroll/stats/overview ─────────────────────────────────────────────
router.get(
  '/stats/overview',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('PAYROLL_VIEW'),
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();

    // Current month's period (if exists)
    const currentPeriod = await PayrollPeriod.findOne({
      where: { month: currentMonth, year: currentYear },
    });

    // Aggregate salary stats for current month
    let monthlySalaryStats: {
      headcount: number;
      totalGross: number;
      totalNet: number;
      totalDeductions: number;
      avgNet: number;
    } = { headcount: 0, totalGross: 0, totalNet: 0, totalDeductions: 0, avgNet: 0 };

    if (currentPeriod) {
      const agg = await EmployeeSalary.findOne({
        attributes: [
          [fn('COUNT', col('id')), 'headcount'],
          [fn('SUM', col('grossSalary')), 'totalGross'],
          [fn('SUM', col('netSalary')), 'totalNet'],
          [fn('SUM', col('totalDeductions')), 'totalDeductions'],
          [fn('AVG', col('netSalary')), 'avgNet'],
        ],
        where: {
          payrollPeriodId: currentPeriod.id,
          status: { [Op.notIn]: ['OnHold'] },
        },
        raw: true,
      }) as any;

      if (agg) {
        monthlySalaryStats = {
          headcount:       Number(agg.headcount)       || 0,
          totalGross:      Number(agg.totalGross)      || 0,
          totalNet:        Number(agg.totalNet)        || 0,
          totalDeductions: Number(agg.totalDeductions) || 0,
          avgNet:          Number(agg.avgNet)          || 0,
        };
      }
    }

    // Active headcount
    const activeStaffCount = await Staff.count({ where: { status: 'Active' } });

    // Year-to-date payroll cost
    const ytdAgg = await EmployeeSalary.findOne({
      attributes: [
        [fn('SUM', col('netSalary')), 'ytdNet'],
        [fn('SUM', col('grossSalary')), 'ytdGross'],
      ],
      where: {
        status: { [Op.in]: ['Paid', 'Processed', 'Approved'] },
      },
      include: [
        {
          model:      PayrollPeriod,
          as:         'payrollPeriod',
          attributes: [],
          where:      { year: currentYear },
          required:   true,
        },
      ],
      raw: true,
    }) as any;

    const ytdStats = {
      ytdNet:   Number(ytdAgg?.ytdNet)   || 0,
      ytdGross: Number(ytdAgg?.ytdGross) || 0,
    };

    // Status breakdown for all periods
    const statusBreakdown = await EmployeeSalary.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    }) as any[];

    const statusSummary: Record<string, number> = {};
    for (const row of statusBreakdown) {
      statusSummary[row.status] = Number(row.count);
    }

    return ResponseFormatter.success(
      res,
      {
        currentPeriod: currentPeriod
          ? { id: currentPeriod.id, periodCode: currentPeriod.periodCode, status: currentPeriod.status }
          : null,
        currentMonth:    monthlySalaryStats,
        activeHeadcount: activeStaffCount,
        yearToDate:      ytdStats,
        statusSummary,
      },
      'Payroll overview retrieved'
    );
  })
);

export default router;
