"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERP_TOOL_DECLARATIONS = void 0;
exports.createToolExecutor = createToolExecutor;
const sequelize_1 = require("sequelize");
const reports_routes_1 = require("../../../routes/reports.routes");
const staff_routes_1 = require("../../../routes/staff.routes");
const payroll_routes_1 = require("../../../routes/payroll.routes");
const leave_routes_1 = require("../../../routes/leave.routes");
const task_routes_1 = require("../../../routes/task.routes");
const Staff_model_1 = require("../../../models/Staff.model");
const Department_model_1 = require("../../../models/Department.model");
const Attendance_model_1 = require("../../../models/Attendance.model");
const Project_model_1 = require("../../../models/Project.model");
const Enrollment_model_1 = require("../../../models/Enrollment.model");
const LeaveRequest_model_1 = require("../../../models/LeaveRequest.model");
function normaliseRole(r) {
    return r.toLowerCase().replace(/[^a-z]/g, '');
}
function isSuperAdminOrAdmin(req) {
    const roles = (req.user?.roles || []).map(normaliseRole);
    return roles.some((r) => ['superadmin', 'admin', 'headofadmin'].includes(r));
}
function hasPermission(req, permissionCode) {
    if (isSuperAdminOrAdmin(req))
        return true;
    const normalized = permissionCode.toLowerCase().replace(/_/g, '.');
    const userPerms = new Set((req.user?.permissions || []).map((p) => p.toLowerCase()));
    return userPerms.has(normalized);
}
const NOT_AUTHORIZED = "You're not authorized to view this information. Ask an administrator if you believe you should have access.";
const VIEW_TOOLS = [
    { name: 'getProfitAndLoss', description: 'Money in, money out and profit for each brand (VisaMax, Kurios SAT, BeadMax, Maxfood Farm) and the whole company for a month, with line items and brand highlights. Use for profit, revenue, expenses, margins or "how did we do this month".', params: { year: { type: 'number' }, month: { type: 'number', description: '1-12' } }, path: (a) => `/erp/profit?year=${a.year || ''}&month=${a.month || ''}` },
    { name: 'getBrandComingUp', description: 'What is coming up or overdue for a brand in the next days: VisaMax appointments, flights, passport expiry; Kurios SAT renewals and project deadlines; BeadMax order due dates and low stock; Maxfood best-before dates and export orders.', params: { brand: { type: 'string', description: 'VM, KS, BM or MF' }, days: { type: 'number' } }, path: (a) => `/erp/agenda?brand=${encodeURIComponent(String(a.brand || 'VM'))}&days=${a.days || 14}` },
    { name: 'getTracking', description: 'Tasks, projects and brand jobs assigned to people, with status, progress, overdue and blocked items. Set mine=true for only the asking user.', params: { mine: { type: 'boolean' } }, path: (a) => `/erp/tracking${a.mine ? '?mine=1' : ''}` },
    { name: 'searchVisaMaxCustomers', description: 'Search VisaMax customer cases (visa applications, stage, destination, appointment dates).', params: { search: { type: 'string' }, stage: { type: 'string' } }, path: (a) => `/erp/travel/cases?limit=20&search=${encodeURIComponent(String(a.search || ''))}${a.stage ? `&stage=${encodeURIComponent(String(a.stage))}` : ''}` },
    { name: 'searchKuriosProjects', description: 'Search Kurios SAT ICT projects (clients, stage, deadlines, value).', params: { search: { type: 'string' } }, path: (a) => `/erp/kurios/projects?limit=20&search=${encodeURIComponent(String(a.search || ''))}` },
    { name: 'searchSupportTickets', description: 'Search customer support tickets for any brand.', params: { search: { type: 'string' }, status: { type: 'string' } }, path: (a) => `/erp/support/tickets?limit=20&search=${encodeURIComponent(String(a.search || ''))}${a.status ? `&status=${encodeURIComponent(String(a.status))}` : ''}` },
    { name: 'searchBeadMaxShopOrders', description: 'BeadMax online shop / Instagram / walk-in orders with payment status and stage.', params: { search: { type: 'string' }, stage: { type: 'string' } }, path: (a) => `/erp/beadmax/shop-orders?limit=20&search=${encodeURIComponent(String(a.search || ''))}${a.stage ? `&stage=${encodeURIComponent(String(a.stage))}` : ''}` },
    { name: 'searchBeadMaxCustomOrders', description: 'BeadMax custom (bespoke) orders with due dates.', params: { search: { type: 'string' } }, path: (a) => `/erp/beadmax/custom-orders?limit=20&search=${encodeURIComponent(String(a.search || ''))}` },
    { name: 'searchMaxfoodExportOrders', description: 'Maxfood Farm export orders (destination, shipping, stage, totals).', params: { search: { type: 'string' } }, path: (a) => `/erp/maxfood/orders?limit=20&search=${encodeURIComponent(String(a.search || ''))}` },
    { name: 'getInventory', description: 'Stock summary for BeadMax or Maxfood Farm: number of products, stock value, low and out of stock items.', params: { brand: { type: 'string', description: 'beadmax or maxfood' } }, path: (a) => `/erp/${String(a.brand || '').toLowerCase().includes('food') || String(a.brand).toUpperCase() === 'MF' ? 'maxfood' : 'beadmax'}/inventory-summary` },
    { name: 'searchProducts', description: 'Search BeadMax products or Maxfood food products with price and stock.', params: { brand: { type: 'string', description: 'beadmax or maxfood' }, search: { type: 'string' } }, path: (a) => `/erp/${String(a.brand || '').toLowerCase().includes('food') || String(a.brand).toUpperCase() === 'MF' ? 'maxfood' : 'beadmax'}/products?limit=25&search=${encodeURIComponent(String(a.search || ''))}` },
    { name: 'searchPayments', description: 'Payments and receipts issued (customer, brand, amount, currency, date). Use for "who paid", "receipts this week".', params: { search: { type: 'string' } }, path: (a) => `/erp/payments?limit=25&search=${encodeURIComponent(String(a.search || ''))}` },
    { name: 'getSchoolFeesOwed', description: 'Students who still owe school fees at the Kurios SAT ICT Training Center (KS) or BeadMax Vocational School (BM).', params: { school: { type: 'string', description: 'KS or BM' } }, path: (a) => `/erp/school/balances?school=${String(a.school || 'KS').toUpperCase() === 'BM' ? 'BM' : 'KS'}` },
    { name: 'getExchangeRates', description: 'Exchange rates (naira per unit) and money held in each foreign currency.', path: () => '/erp/fx' },
    { name: 'getCompanyTargets', description: 'Company-wide and brand targets for this month/quarter/year with progress so far.', path: () => '/erp/targets' },
    { name: 'getBirthdays', description: 'Staff birthdays today and in the coming weeks.', path: () => '/erp/birthdays' },
    { name: 'getHolidaysAndCelebrations', description: 'Nigerian public holidays and international celebrations for a year.', params: { year: { type: 'number' } }, path: (a) => `/calendar/observances?year=${a.year || new Date().getFullYear()}` },
];
async function openView(req, path) {
    const port = process.env.PORT || 3000;
    const token = String(req.headers.authorization || '');
    const res = await fetch(`http://127.0.0.1:${port}/api${path}`, { headers: { Authorization: token } });
    const body = await res.json().catch(() => ({}));
    if (res.status === 403)
        return NOT_AUTHORIZED;
    if (!res.ok || body?.success === false)
        return `Could not open this information: ${body?.message || res.status}`;
    const text = JSON.stringify(body.data ?? body);
    return text.length > 14000 ? `${text.slice(0, 14000)}… (truncated)` : text;
}
exports.ERP_TOOL_DECLARATIONS = [
    ...VIEW_TOOLS.map((t) => ({ name: t.name, description: t.description, parameters: { type: 'object', properties: t.params || {} } })),
    {
        name: 'getAttendanceInsights',
        description: 'Get attendance statistics (present/absent/late counts per staff member, monthly trend, department rates) for a given month and year. Use this for questions like "who was absent this week" or "what is our attendance rate".',
        parameters: {
            type: 'object',
            properties: {
                month: { type: 'number', description: 'Month number 1-12. Defaults to the current month.' },
                year: { type: 'number', description: 'Four-digit year. Defaults to the current year.' },
            },
        },
    },
    {
        name: 'searchEmployees',
        description: 'Search for employees/staff by name, email, employee ID, department, branch, or status. Use this for questions like "find John in Sales" or "who works in the Lagos branch".',
        parameters: {
            type: 'object',
            properties: {
                search: { type: 'string', description: 'Free-text search against first name, last name, email, or employee ID.' },
                departmentId: { type: 'number', description: 'Filter by department ID, if known.' },
                status: { type: 'string', description: 'Staff status, e.g. Active, Inactive.' },
            },
        },
    },
    {
        name: 'getPayrollSummary',
        description: 'Get the current payroll overview: headcount, gross/net totals, deductions, year-to-date payroll cost, and status breakdown for the current period. Use this for questions about payroll totals or payroll status.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'getLeaveSummary',
        description: "Get the current user's own leave balance: total/used/available days broken down by leave type. Use this for questions like \"how much leave do I have left\".",
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'getDashboardInsights',
        description: 'Get high-level organizational dashboard metrics (headcount, attendance rate, active projects, revenue, pending approvals). Scope of data depends on the asking user\'s role. Use this for broad "how are we doing" questions.',
        parameters: { type: 'object', properties: {} },
    },
    {
        name: 'getMyTasks',
        description: 'Get the asking user\'s pending (not Done/Cancelled) tasks, sorted by due date, including which are overdue or due today. For a Staff member this is their own assigned tasks plus any personal tasks they created; for a Head of Department it is their department\'s pending tasks; for HR/Admin/Super Admin it is company-wide. Use this for questions like "summarize today\'s pending tasks", "what tasks do I have", "what is overdue", or "what is my team working on".',
        parameters: { type: 'object', properties: {} },
    },
];
async function handleGetAttendanceInsights(req, args) {
    const now = new Date();
    const month = Math.min(12, Math.max(1, Number(args.month) || now.getMonth() + 1));
    const year = Number(args.year) || now.getFullYear();
    const data = await (0, reports_routes_1.getAttendanceReportData)(month, year);
    return JSON.stringify(data);
}
async function handleSearchEmployees(req, args) {
    const { count, rows } = await (0, staff_routes_1.searchStaff)({
        search: args.search,
        departmentId: args.departmentId,
        status: args.status,
        limit: 10,
    });
    return JSON.stringify({
        total: count,
        employees: rows.map((r) => ({
            name: `${r.firstName} ${r.lastName}`,
            employeeId: r.employeeId,
            email: r.email,
            department: r.department?.name,
            designation: r.designation?.name,
            status: r.status,
        })),
    });
}
async function handleGetPayrollSummary(req) {
    if (!hasPermission(req, 'PAYROLL_VIEW'))
        return NOT_AUTHORIZED;
    const data = await (0, payroll_routes_1.getPayrollOverview)();
    return JSON.stringify(data);
}
async function handleGetLeaveSummary(req) {
    const data = await (0, leave_routes_1.getLeaveBalance)(req.user?.staffId);
    return JSON.stringify(data);
}
async function handleGetDashboardInsights(req) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    if (isSuperAdminOrAdmin(req)) {
        const [totalEmployees, totalDepartments, todayPresent, todayTotal, activeProjects, totalStudents, revenueResult, pendingApprovals] = await Promise.all([
            Staff_model_1.Staff.count({ where: { status: 'Active' } }),
            Department_model_1.Department.count(),
            Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: { [sequelize_1.Op.in]: ['Present', 'Late'] } } }),
            Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } } }),
            Project_model_1.Project.count({ where: { status: 'Active' } }),
            Enrollment_model_1.Enrollment.count({ where: { status: { [sequelize_1.Op.in]: ['Enrolled', 'InProgress'] } } }),
            require('../../../utils/revenue').cashRevenueNgn(),
            LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
        ]);
        return JSON.stringify({
            scope: 'organization-wide',
            totalEmployees,
            totalDepartments,
            attendanceRate: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0,
            activeProjects,
            totalStudents,
            totalRevenueNgn: revenueResult ?? 0,
            pendingApprovals,
        });
    }
    const [totalStaff, pendingApprovals, todayPresent, todayTotal, activeProjects] = await Promise.all([
        Staff_model_1.Staff.count({ where: { status: 'Active' } }),
        LeaveRequest_model_1.LeaveRequest.count({ where: { status: 'Pending' } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] }, status: { [sequelize_1.Op.in]: ['Present', 'Late'] } } }),
        Attendance_model_1.Attendance.count({ where: { attendanceDate: { [sequelize_1.Op.between]: [startOfDay, endOfDay] } } }),
        Project_model_1.Project.count({ where: { status: 'Active' } }),
    ]);
    return JSON.stringify({
        scope: 'department',
        totalStaff,
        pendingApprovals,
        averageAttendance: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 1000) / 10 : 0,
        activeProjects,
    });
}
async function handleGetMyTasks(req) {
    const data = await (0, task_routes_1.getPendingTasksSummary)(req);
    return JSON.stringify(data);
}
function createToolExecutor(req) {
    return async (name, args) => {
        try {
            switch (name) {
                case 'getAttendanceInsights': return await handleGetAttendanceInsights(req, args);
                case 'searchEmployees': return await handleSearchEmployees(req, args);
                case 'getPayrollSummary': return await handleGetPayrollSummary(req);
                case 'getLeaveSummary': return await handleGetLeaveSummary(req);
                case 'getDashboardInsights': return await handleGetDashboardInsights(req);
                case 'getMyTasks': return await handleGetMyTasks(req);
                default: {
                    const view = VIEW_TOOLS.find((t) => t.name === name);
                    return view ? await openView(req, view.path(args || {})) : `Unknown tool: ${name}`;
                }
            }
        }
        catch (err) {
            return `Error retrieving this data: ${err.message}`;
        }
    };
}
//# sourceMappingURL=ERPTools.js.map