"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const VisaApplicant_model_1 = require("../models/VisaApplicant.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
const VISA_TYPE_ENUM = ['Tourist', 'Business', 'Student', 'Work', 'Residence'];
function toVisaType(serviceType) {
    if (VISA_TYPE_ENUM.includes(serviceType))
        return serviceType;
    const map = {
        'Overseas Study': 'Student',
        'Work Visa / Job Travel': 'Work',
        'Business Travel': 'Business',
        'Immigration Consulting': 'Residence',
    };
    return map[serviceType] ?? 'Tourist';
}
async function nextClientCode() {
    const all = await VisaApplicant_model_1.VisaApplicant.findAll({
        where: { clientCode: { [sequelize_1.Op.like]: 'VMC-%' } },
        attributes: ['clientCode'],
        paranoid: false,
    });
    const maxNum = all.reduce((max, row) => {
        const n = parseInt(row.clientCode.replace('VMC-', ''), 10);
        return Number.isFinite(n) && n > max ? n : max;
    }, 0);
    return `VMC-${String(maxNum + 1).padStart(3, '0')}`;
}
function toBackendStatus(s) {
    const map = {
        'Pending': 'New',
        'Processing': 'In Progress',
        'Awaiting Docs': 'Document Review',
        'Approved': 'Approved',
        'Completed': 'Approved',
        'Rejected': 'Rejected',
        'On Hold': 'Cancelled',
    };
    return map[s] ?? 'New';
}
function toFrontend(a) {
    const statusMap = {
        'New': 'Pending',
        'In Progress': 'Processing',
        'Document Review': 'Awaiting Docs',
        'Interview': 'Processing',
        'Approved': 'Approved',
        'Rejected': 'Rejected',
        'Cancelled': 'On Hold',
    };
    const notesRaw = a.notes ?? '';
    const metaMatch = notesRaw.match(/^__META__(.+?)\|\|/s);
    let meta = {};
    let userNotes = notesRaw;
    if (metaMatch) {
        meta = Object.fromEntries(metaMatch[1].split(';').filter(Boolean).map((p) => p.split(':')));
        userNotes = notesRaw.slice(metaMatch[0].length);
    }
    return {
        id: Number(a.id),
        clientCode: a.clientCode,
        clientName: `${a.firstName} ${a.lastName}`.trim(),
        clientPhone: a.phone,
        clientEmail: a.email,
        serviceType: meta.serviceType || a.visaType || 'Visa Processing',
        destination: a.destinationCountry,
        status: statusMap[a.status] ?? 'Pending',
        assignedTo: meta.assignedTo || '',
        applicationDate: a.applicationDate?.toISOString?.()?.slice(0, 10) ?? '',
        processingDate: meta.processingDate || '',
        expectedCompletion: a.expectedDecisionDate?.toISOString?.()?.slice(0, 10) ?? meta.expectedCompletion ?? '',
        actualCompletion: meta.actualCompletion || '',
        notes: userNotes.trim(),
    };
}
function buildNotes(payload, existingNotes = '') {
    const meta = {
        serviceType: payload.serviceType ?? '',
        processingDate: payload.processingDate ?? '',
        expectedCompletion: payload.expectedCompletion ?? '',
        actualCompletion: payload.actualCompletion ?? '',
        assignedTo: payload.assignedTo ?? '',
    };
    const metaStr = Object.entries(meta).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(';');
    return metaStr ? `__META__${metaStr}||${payload.notes ?? ''}` : (payload.notes ?? existingNotes);
}
router.get('/applications', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status, visaType, priority, search, page = 1, limit = 100 } = req.query;
    const where = {};
    if (status)
        where.status = toBackendStatus(status);
    if (visaType)
        where.visaType = toVisaType(visaType);
    if (priority)
        where.priorityLevel = priority;
    if (search) {
        where[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { lastName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { passportNumber: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { destinationCountry: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { clientCode: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await VisaApplicant_model_1.VisaApplicant.findAndCountAll({
        where,
        order: [['applicationDate', 'DESC']],
        limit: Number(limit),
        offset,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, {
        data: rows.map(toFrontend),
        pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / Number(limit)) },
    }, 'Visa applications retrieved');
}));
router.get('/applications/stats', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, pending, inProgress, approved, rejected] = await Promise.all([
        VisaApplicant_model_1.VisaApplicant.count(),
        VisaApplicant_model_1.VisaApplicant.count({ where: { status: 'New' } }),
        VisaApplicant_model_1.VisaApplicant.count({ where: { status: { [sequelize_1.Op.in]: ['In Progress', 'Document Review', 'Interview'] } } }),
        VisaApplicant_model_1.VisaApplicant.count({ where: { status: 'Approved' } }),
        VisaApplicant_model_1.VisaApplicant.count({ where: { status: 'Rejected' } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, pending, inProgress, approved, rejected }, 'Stats retrieved');
}));
router.get('/applications/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const app = await VisaApplicant_model_1.VisaApplicant.findByPk(req.params.id);
    if (!app)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Application not found');
    ResponseFormatter_1.ResponseFormatter.success(res, toFrontend(app), 'Application retrieved');
}));
router.post('/applications', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { clientName, clientPhone, clientEmail, serviceType, destination, status, applicationDate, expectedCompletion, assignedTo, notes, processingDate, actualCompletion } = req.body;
    if (!clientName || !serviceType || !destination) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'clientName, serviceType, destination are required', 400);
    }
    const nameParts = clientName.trim().split(' ');
    const firstName = nameParts[0] ?? clientName;
    const lastName = nameParts.slice(1).join(' ') || '-';
    const app = await VisaApplicant_model_1.VisaApplicant.create({
        organizationId: BigInt(1),
        clientCode: await nextClientCode(),
        firstName,
        lastName,
        email: clientEmail || `${Date.now()}@placeholder.com`,
        phone: clientPhone || '',
        passportNumber: `VX-${Date.now()}`,
        visaType: toVisaType(serviceType),
        destinationCountry: destination,
        applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
        status: toBackendStatus(status || 'Pending'),
        priorityLevel: 'Medium',
        documentStatus: 'Pending',
        expectedDecisionDate: expectedCompletion ? new Date(expectedCompletion) : undefined,
        notes: buildNotes({ serviceType, processingDate, expectedCompletion, actualCompletion, assignedTo, notes }),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, toFrontend(app), 'Application created', 201);
}));
router.put('/applications/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const app = await VisaApplicant_model_1.VisaApplicant.findByPk(req.params.id);
    if (!app)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Application not found');
    const { clientName, clientPhone, clientEmail, serviceType, destination, status, expectedCompletion, assignedTo, notes, processingDate, actualCompletion } = req.body;
    const nameParts = clientName ? clientName.trim().split(' ') : null;
    const updates = {};
    if (nameParts) {
        updates.firstName = nameParts[0];
        updates.lastName = nameParts.slice(1).join(' ') || app.lastName;
    }
    if (clientPhone)
        updates.phone = clientPhone;
    if (clientEmail)
        updates.email = clientEmail;
    if (serviceType)
        updates.visaType = toVisaType(serviceType);
    if (destination)
        updates.destinationCountry = destination;
    if (status)
        updates.status = toBackendStatus(status);
    if (expectedCompletion)
        updates.expectedDecisionDate = new Date(expectedCompletion);
    const currentMeta = {
        serviceType: serviceType ?? '',
        processingDate: processingDate ?? '',
        expectedCompletion: expectedCompletion ?? '',
        actualCompletion: actualCompletion ?? '',
        assignedTo: assignedTo ?? '',
        notes: notes ?? '',
    };
    updates.notes = buildNotes(currentMeta);
    await app.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, toFrontend(app.reload ? await app.reload() : app), 'Application updated');
}));
router.patch('/applications/:id/status', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status, rejectionReason } = req.body;
    if (!status)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'status is required', 400);
    const app = await VisaApplicant_model_1.VisaApplicant.findByPk(req.params.id);
    if (!app)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Application not found');
    await app.update({ status: toBackendStatus(status), rejectionReason: rejectionReason ?? app.rejectionReason });
    ResponseFormatter_1.ResponseFormatter.success(res, toFrontend(app), 'Status updated');
}));
router.delete('/applications/:id', AuthMiddleware_1.default.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const app = await VisaApplicant_model_1.VisaApplicant.findByPk(req.params.id);
    if (!app)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Application not found');
    await app.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Application deleted');
}));
exports.default = router;
//# sourceMappingURL=visamax.routes.js.map