"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAttendanceReportData = getAttendanceReportData;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const Attendance_model_1 = require("../models/Attendance.model");
const Staff_model_1 = require("../models/Staff.model");
const Department_model_1 = require("../models/Department.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
async function getAttendanceReportData(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const monthRecords = await Attendance_model_1.Attendance.findAll({
        where: { attendanceDate: { [sequelize_1.Op.between]: [startDate, endDate] } },
        include: [{
                model: Staff_model_1.Staff,
                attributes: ['firstName', 'lastName', 'employeeId'],
                include: [{ model: Department_model_1.Department, as: 'department', attributes: ['name'] }],
            }],
    });
    const staffMap = new Map();
    for (const r of monthRecords) {
        const s = r.Staff ?? r.staff;
        const key = String(r.staffId);
        if (!staffMap.has(key)) {
            const dept = s?.Department?.name ?? s?.department?.name ?? 'Unknown';
            staffMap.set(key, {
                name: `${s?.firstName ?? ''} ${s?.lastName ?? ''}`.trim() || 'Unknown',
                dept,
                present: 0,
                absent: 0,
                late: 0,
            });
        }
        const entry = staffMap.get(key);
        if (r.status === 'Present' || r.status === 'HalfDay')
            entry.present++;
        else if (r.status === 'Absent')
            entry.absent++;
        else if (r.status === 'Late')
            entry.late++;
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
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);
    const yearRecords = await Attendance_model_1.Attendance.findAll({
        where: { attendanceDate: { [sequelize_1.Op.between]: [yearStart, yearEnd] } },
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
    const deptMap = new Map();
    for (const r of monthRecords) {
        const s = r.Staff ?? r.staff;
        const dept = s?.Department?.name ?? s?.department?.name ?? 'Unknown';
        if (!deptMap.has(dept))
            deptMap.set(dept, { total: 0, present: 0 });
        const d = deptMap.get(dept);
        d.total++;
        if (r.status === 'Present' || r.status === 'HalfDay')
            d.present++;
    }
    const deptData = Array.from(deptMap.entries()).map(([dept, d]) => ({
        dept,
        rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
    }));
    return {
        records: staffRecords,
        monthly: monthlyData,
        departments: deptData,
    };
}
router.get('/attendance', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const month = Math.min(12, Math.max(1, parseInt(req.query.month) || new Date().getMonth() + 1));
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await getAttendanceReportData(month, year);
    ResponseFormatter_1.ResponseFormatter.success(res, data);
}));
exports.default = router;
//# sourceMappingURL=reports.routes.js.map