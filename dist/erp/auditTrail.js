"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientIp = clientIp;
exports.authAuditMiddleware = authAuditMiddleware;
exports.changeAuditMiddleware = changeAuditMiddleware;
exports.auditLogout = auditLogout;
exports.auditLogRouter = auditLogRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const helpers_1 = require("./helpers");
const recordRouter_1 = require("./recordRouter");
function clientIp(req) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return (fwd || req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '').slice(0, 45);
}
async function write(row) {
    try {
        await helpers_1.db.query(`INSERT INTO audit_logs (uuid, module, action, entity, "entityId", description, changes, "userId", "ipAddress", "userAgent", status, "createdAt")
       VALUES (gen_random_uuid(), :module, :action, :entity, :entityId, :description, :changes, :userId, :ip, :ua, :status, NOW())`, {
            replacements: {
                module: row.module.slice(0, 100), action: row.action.slice(0, 50), entity: row.entity.slice(0, 100),
                entityId: Number(row.entityId) || 0, description: row.description.slice(0, 2000),
                changes: row.changes ? JSON.stringify(row.changes).slice(0, 20000) : null,
                userId: Number(row.userId) || 0, ip: row.ip || null, ua: row.ua || null, status: row.status || 'Success',
            },
        });
    }
    catch (e) {
        console.error('[audit]', e.message);
    }
}
async function userIdByEmail(email) {
    if (!email)
        return 0;
    const r = await helpers_1.db.query(`SELECT id FROM users WHERE LOWER(email) = LOWER(:e) LIMIT 1`, { replacements: { e: email }, type: sequelize_1.QueryTypes.SELECT });
    return r[0] ? Number(r[0].id) : 0;
}
function onJson(res, cb) {
    const orig = res.json.bind(res);
    res.json = (body) => {
        try {
            cb(body);
        }
        catch { }
        return orig(body);
    };
}
function authAuditMiddleware() {
    const r = (0, express_1.Router)();
    const ua = (req) => req.get('user-agent') || null;
    r.post('/auth/login', (req, res, next) => {
        const email = String(req.body?.email || '').trim();
        onJson(res, (body) => {
            const okLogin = res.statusCode < 400 && body?.success !== false;
            const user = body?.data?.user;
            setImmediate(async () => write({
                module: 'Auth', entity: 'User Session',
                action: okLogin ? (body?.data?.requiresMFA ? 'Login code sent' : 'Login') : 'Login failed',
                entityId: user?.id || 0, userId: user?.id || (await userIdByEmail(email)),
                description: okLogin
                    ? (body?.data?.requiresMFA ? `${email} entered the right password; verification code sent` : `${email} signed in`)
                    : `Failed sign-in for ${email || 'unknown email'}: ${String(body?.message || 'wrong details').slice(0, 160)}`,
                ip: clientIp(req), ua: ua(req), status: okLogin ? 'Success' : 'Failed',
            }));
        });
        next();
    });
    r.post('/auth/2fa/verify-login', (req, res, next) => {
        onJson(res, (body) => {
            const okLogin = res.statusCode < 400 && body?.success !== false;
            const user = body?.data?.user;
            setImmediate(async () => write({
                module: 'Auth', entity: 'User Session', action: okLogin ? 'Login' : 'Login failed',
                entityId: user?.id || 0, userId: user?.id || (await userIdByEmail(String(req.body?.email || ''))),
                description: okLogin ? `${user?.email || 'User'} signed in (code verified)` : `Wrong or expired sign-in code${req.body?.email ? ` for ${req.body.email}` : ''}`,
                ip: clientIp(req), ua: ua(req), status: okLogin ? 'Success' : 'Failed',
            }));
        });
        next();
    });
    for (const [path, label] of [['/auth/forgot-password', 'Password reset requested'], ['/auth/reset-password', 'Password reset']]) {
        r.post(path, (req, res, next) => {
            const email = String(req.body?.email || '').trim();
            onJson(res, (body) => {
                const okReq = res.statusCode < 400 && body?.success !== false;
                setImmediate(async () => write({
                    module: 'Auth', entity: 'User', action: okReq ? label : `${label} failed`,
                    userId: await userIdByEmail(email), entityId: 0,
                    description: `${label}${email ? ` for ${email}` : ''}${okReq ? '' : `: ${String(body?.message || '').slice(0, 160)}`}`,
                    ip: clientIp(req), ua: ua(req), status: okReq ? 'Success' : 'Failed',
                }));
            });
            next();
        });
    }
    return r;
}
const SKIP = [
    /^\/messages/, /^\/conversations/, /^\/chat/, /^\/notifications/, /^\/erp\/push/, /^\/erp\/calls/, /^\/auth\/refresh/,
    /^\/ai/, /^\/erp\/timeline\/[^/]+\/\d+$/, /^\/attendance\/(heartbeat|ping)/, /^\/presence/, /^\/audit-logs/,
];
const MODULE_NAMES = {
    hr: 'HR', staff: 'Staff', leave: 'Leave', payroll: 'Payroll', 'customer-reports': 'Customer reports', clients: 'Clients',
    tasks: 'Tasks', projects: 'Projects', calendar: 'Calendar', inventory: 'Inventory', 'job-postings': 'Recruitment',
    'job-applications': 'Recruitment', attendance: 'Attendance', training: 'Training', students: 'School', courses: 'School',
    enrollments: 'School', 'fee-receipts': 'School fees', folders: 'Files', files: 'Files', settings: 'Settings', users: 'Users',
    roles: 'Roles', departments: 'Departments', branches: 'Branches', expenses: 'Expenses', invoices: 'Invoices', erp: 'Brands',
};
function changeAuditMiddleware() {
    return (req, res, next) => {
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method))
            return next();
        const path = req.path;
        if (SKIP.some((re) => re.test(path)))
            return next();
        res.on('finish', () => {
            if (res.statusCode >= 400 || req.__audited)
                return;
            const user = req.user;
            if (!user?.id)
                return;
            const parts = path.split('/').filter(Boolean);
            const top = parts[0] === 'erp' && parts[1] ? parts[1] : parts[0] || 'app';
            const moduleName = MODULE_NAMES[top] || MODULE_NAMES[parts[0]] || top.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            const idPart = [...parts].reverse().find((p) => /^\d+$/.test(p));
            const verb = parts[parts.length - 1];
            const action = req.method === 'DELETE' ? 'Delete'
                : /approve/.test(verb) ? 'Approve' : /reject/.test(verb) ? 'Reject' : /submit/.test(verb) ? 'Submit'
                    : /void|cancel/.test(verb) ? 'Cancel' : /send|resend|notify/.test(verb) ? 'Send'
                        : req.method === 'POST' && !idPart ? 'Create' : 'Update';
            const PAST = { Create: 'Created', Update: 'Updated', Delete: 'Deleted', Approve: 'Approved', Reject: 'Rejected', Submit: 'Submitted', Cancel: 'Cancelled', Send: 'Sent' };
            const label = req.body?.title || req.body?.name || req.body?.clientName || req.body?.customerName || req.body?.subject || '';
            const what = parts.filter((p) => !/^\d+$/.test(p) && p !== 'erp' && p !== 'api').join(' › ').replace(/-/g, ' ');
            write({
                module: moduleName, action, entity: what.slice(0, 100) || moduleName, entityId: idPart || 0, userId: user.id,
                description: `${PAST[action] || action} ${what}${idPart ? ` #${idPart}` : ''}${label ? ` — “${String(label).slice(0, 80)}”` : ''}`,
                ip: clientIp(req), ua: req.get('user-agent') || null,
            });
        });
        next();
    };
}
async function auditLogout(req) {
    const user = req.user;
    await write({ module: 'Auth', entity: 'User Session', action: 'Logout', userId: user?.id, entityId: user?.id, description: `${user?.email || 'User'} signed out`, ip: clientIp(req), ua: req.get('user-agent') || null });
}
function device(ua) {
    if (!ua)
        return '';
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : /okhttp|Dart|axios|node/i.test(ua) ? 'App' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iPhone / iPad' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : '';
    return os ? `${browser} on ${os}` : browser;
}
function auditLogRouter() {
    const r = (0, express_1.Router)();
    r.get('/', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hr')
            return (0, recordRouter_1.fail)(res, 403, 'Only management can view the audit log');
        const { action, module: mod, search, startDate, endDate, userId: uid, status } = req.query;
        const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
        const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '25'), 10)));
        const where = ['1=1'];
        const rep = { limit, offset: (page - 1) * limit };
        if (action && action !== 'All') {
            if (action === 'Login')
                where.push(`a.action IN ('Login', 'Login failed', 'Login code sent')`);
            else {
                where.push('LOWER(a.action) = LOWER(:action)');
                rep.action = action;
            }
        }
        if (mod && mod !== 'All') {
            where.push(mod === 'Brands' ? "(a.module ILIKE 'erp' OR a.module ILIKE '%brand%')" : 'a.module ILIKE :mod');
            rep.mod = `%${mod}%`;
        }
        if (status && status !== 'All') {
            where.push('a.status::text = :status');
            rep.status = status;
        }
        if (uid) {
            where.push('a."userId" = :uid');
            rep.uid = Number(uid);
        }
        if (startDate) {
            where.push('a."createdAt" >= :start');
            rep.start = new Date(startDate);
        }
        if (endDate) {
            const e = new Date(endDate);
            e.setDate(e.getDate() + 1);
            where.push('a."createdAt" < :end');
            rep.end = e;
        }
        if (search) {
            where.push(`(a.description ILIKE :s OR u.email ILIKE :s OR (u."firstName" || ' ' || u."lastName") ILIKE :s OR a."ipAddress" ILIKE :s OR a.entity ILIKE :s)`);
            rep.s = `%${search}%`;
        }
        const sqlWhere = where.join(' AND ');
        const rows = await helpers_1.db.query(`SELECT a.id, a.module, a.action, a.entity, a."entityId", a.description, a.changes, a."userId", a."ipAddress", a."userAgent", a.status, a."createdAt",
              u.email AS "userEmail", NULLIF(TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')), '') AS "userName"
       FROM audit_logs a LEFT JOIN users u ON u.id = a."userId"
       WHERE ${sqlWhere} ORDER BY a."createdAt" DESC, a.id DESC LIMIT :limit OFFSET :offset`, { replacements: rep, type: sequelize_1.QueryTypes.SELECT });
        const total = await helpers_1.db.query(`SELECT COUNT(*)::int AS n FROM audit_logs a LEFT JOIN users u ON u.id = a."userId" WHERE ${sqlWhere}`, { replacements: rep, type: sequelize_1.QueryTypes.SELECT });
        const since = new Date(Date.now() - 24 * 3600000);
        const stats = await helpers_1.db.query(`SELECT COUNT(*) FILTER (WHERE action = 'Login')::int AS logins, COUNT(*) FILTER (WHERE action = 'Login failed')::int AS failed,
              COUNT(DISTINCT "userId") FILTER (WHERE action = 'Login')::int AS people, COUNT(*) FILTER (WHERE module <> 'Auth')::int AS changes
       FROM audit_logs WHERE "createdAt" >= :since`, { replacements: { since }, type: sequelize_1.QueryTypes.SELECT });
        const data = rows.map((r) => {
            let details = null;
            try {
                details = r.changes ? JSON.parse(r.changes) : null;
            }
            catch {
                details = r.changes;
            }
            return {
                id: Number(r.id), module: r.module === 'erp' ? 'Brands' : r.module, action: String(r.action || '').charAt(0).toUpperCase() + String(r.action || '').slice(1), resource: r.entityId ? `${r.entity} #${r.entityId}` : r.entity,
                description: r.description, details, userId: Number(r.userId) || null, userName: r.userName || (Number(r.userId) ? `User ${r.userId}` : 'Visitor'),
                userEmail: r.userEmail, ipAddress: r.ipAddress, device: device(r.userAgent), userAgent: r.userAgent, status: r.status, createdAt: r.createdAt,
            };
        });
        return res.json({
            success: true, data, last24h: stats[0],
            pagination: { page, limit, total: total[0]?.n || 0, totalPages: Math.max(1, Math.ceil((total[0]?.n || 0) / limit)) },
        });
    }));
    r.get('/:id(\\d+)', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req) && (0, helpers_1.roleOf)(req) !== 'hr')
            return (0, recordRouter_1.fail)(res, 403, 'Only management can view the audit log');
        const rows = await helpers_1.db.query(`SELECT a.*, u.email AS "userEmail", u."firstName", u."lastName" FROM audit_logs a LEFT JOIN users u ON u.id = a."userId" WHERE a.id = :id`, { replacements: { id: Number(req.params.id) }, type: sequelize_1.QueryTypes.SELECT });
        if (!rows[0])
            return (0, recordRouter_1.fail)(res, 404, 'Not found');
        const r = rows[0];
        return (0, recordRouter_1.ok)(res, { ...r, device: device(r.userAgent), userName: r.firstName ? `${r.firstName} ${r.lastName}` : null });
    }));
    return r;
}
//# sourceMappingURL=auditTrail.js.map