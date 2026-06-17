import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { Attendance } from '@models/Attendance.model';
import { Staff } from '@models/Staff.model';
import { Department } from '@models/Department.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = Router();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/reports/attendance?month=X&year=Y
router.get('/attendance', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const month = Math.min(12, Math.max(1, parseInt(req.query.month as string) || new Date().getMonth() + 1));
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const monthRecords = await Attendance.findAll({
    where: { attendanceDate: { [Op.between]: [startDate, endDate] } },
    include: [{
      model: Staff,
      attributes: ['firstName', 'lastName', 'employeeId'],
      include: [{ model: Department, attributes: ['name'] }],
    }],
  });

  const staffMap = new Map<string, { name: string; dept: string; present: number; absent: number; late: number }>();
  for (const r of monthRecords) {
    const s = (r as any).Staff ?? (r as any).staff;
    const key = String(r.staffId);
    if (!staffMap.has(key)) {
      const dept = (s as any)?.Department?.name ?? (s as any)?.department?.name ?? 'Unknown';
      staffMap.set(key, {
        name: `${s?.firstName ?? ''} ${s?.lastName ?? ''}`.trim() || 'Unknown',
        dept,
        present: 0,
        absent: 0,
        late: 0,
      });
    }
    const entry = staffMap.get(key)!;
    if (r.status === 'Present' || r.status === 'HalfDay') entry.present++;
    else if (r.status === 'Absent') entry.absent++;
    else if (r.status === 'Late') entry.late++;
  }

  const staffRecords = Array.from(staffMap.values()).map(s => {
    const total = s.present + s.absent + s.late;
    const pct = total > 0 ? Math.round((s.present / total) * 100) : 0;
    return {
      ...s,
      rate: `${pct}%`,
      status: pct >= 90 ? 'Excellent' : pct >= 80 ? 'Good' : pct >= 70 ? 'Average' : 'Poor',
    };
  });

  // Full-year trend
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const yearRecords = await Attendance.findAll({
    where: { attendanceDate: { [Op.between]: [yearStart, yearEnd] } },
    attributes: ['attendanceDate', 'status'],
  });

  const monthlyData = MONTHS.map((m, i) => {
    const recs = yearRecords.filter(r => new Date(r.attendanceDate).getMonth() === i);
    return {
      month: m,
      present: recs.filter(r => r.status === 'Present' || r.status === 'HalfDay').length,
      absent: recs.filter(r => r.status === 'Absent').length,
      late: recs.filter(r => r.status === 'Late').length,
    };
  });

  // Department rates from current month
  const deptMap = new Map<string, { total: number; present: number }>();
  for (const r of monthRecords) {
    const s = (r as any).Staff ?? (r as any).staff;
    const dept = (s as any)?.Department?.name ?? (s as any)?.department?.name ?? 'Unknown';
    if (!deptMap.has(dept)) deptMap.set(dept, { total: 0, present: 0 });
    const d = deptMap.get(dept)!;
    d.total++;
    if (r.status === 'Present' || r.status === 'HalfDay') d.present++;
  }

  const deptData = Array.from(deptMap.entries()).map(([dept, d]) => ({
    dept,
    rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
  }));

  ResponseFormatter.success(res, {
    records: staffRecords,
    monthly: monthlyData,
    departments: deptData,
  });
}));

export default router;
