"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGES = void 0;
exports.buildChecklist = buildChecklist;
exports.brandModulesRouter = brandModulesRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("../models");
const recordRouter_1 = require("../recordRouter");
const helpers_1 = require("../helpers");
exports.STAGES = {
    travelCase: ['Inquiry', 'Consultation', 'Onboarding', 'Documents Collection', 'Application Submitted', 'Appointment / Biometrics', 'Awaiting Decision', 'Approved', 'Rejected', 'Travelled', 'Closed'],
    booking: ['Quoted', 'Reserved', 'Ticketed', 'Confirmed', 'Completed', 'Cancelled'],
    techProject: ['Lead', 'Requirement Gathering', 'Proposal Sent', 'Contract Signed', 'Design', 'Development', 'Testing', 'Deployed', 'Maintenance', 'Completed', 'Cancelled'],
    subscription: ['Active', 'Expiring', 'Expired', 'Cancelled'],
    ticket: ['Open', 'In Progress', 'Waiting on Client', 'Resolved', 'Closed'],
    customOrder: ['Request', 'Design', 'Awaiting Deposit', 'Approved', 'Production', 'Quality Check', 'Ready', 'Delivered', 'Cancelled'],
    exportOrder: ['Order Received', 'Payment Confirmed', 'Sourcing', 'Processing & Packaging', 'Documentation', 'Customs Clearance', 'Shipped', 'In Transit', 'Arrived Destination', 'Delivered', 'Cancelled'],
};
const BASE_DOCS = ['International passport (valid 6+ months, 2 blank pages)', 'Recent passport photographs', 'Completed application form', 'Bank statement (last 6 months)', 'Employment letter / business registration (CAC)', 'Flight reservation / itinerary', 'Hotel booking or invitation letter', 'Travel insurance'];
const EXTRA_DOCS = {
    Student: ['Admission / offer letter', 'Academic transcripts & certificates', 'English test result (IELTS/TOEFL/etc.)', 'Proof of tuition payment', 'Sponsor letter & sponsor bank statement', 'CAS / I-20 / confirmation of enrolment', 'Tuberculosis test (where required)'],
    'Overseas Study': ['Admission / offer letter', 'Academic transcripts & certificates', 'English test result (IELTS/TOEFL/etc.)', 'Proof of tuition payment', 'Sponsor letter & sponsor bank statement', 'CAS / I-20 / confirmation of enrolment'],
    Work: ['Job offer / employment contract', 'Work permit / certificate of sponsorship', 'Updated CV', 'Professional certificates', 'Police clearance certificate', 'Medical report'],
    'Work Visa / Job Travel': ['Job offer / employment contract', 'Work permit / certificate of sponsorship', 'Updated CV', 'Police clearance certificate', 'Medical report'],
    'Family Visa': ['Marriage / birth certificates', "Sponsor's residence permit / passport", "Sponsor's proof of income & accommodation", 'Relationship evidence (photos, communication)'],
    Business: ['Invitation letter from host company', 'Company registration documents', 'Company bank statement', 'Letter of introduction from employer'],
    'Business Travel': ['Invitation letter from host company', 'Company registration documents', 'Company bank statement', 'Letter of introduction from employer'],
    Residence: ['Proof of residence ties / property', 'Police clearance certificate', 'Medical report', 'Birth certificate'],
    'Immigration Consulting': ['Educational credential assessment (ECA)', 'Language test result', 'Proof of funds', 'Police clearance certificate', 'Reference letters'],
};
const BOOKING_ONLY = ['Flight Booking', 'Hotel Reservation', 'Airport Pickup', 'Travel Insurance'];
function buildChecklist(serviceType, visaType) {
    const list = BOOKING_ONLY.includes(serviceType || '')
        ? ['International passport data page', 'Travel dates & route', 'Passenger details (name as on passport, date of birth)']
        : [...BASE_DOCS, ...(EXTRA_DOCS[visaType || ''] || EXTRA_DOCS[serviceType || ''] || [])];
    return [...new Set(list)].map((item) => ({ item, required: true, received: false, fileUrl: null, note: '' }));
}
const SLA_HOURS = { Urgent: 4, High: 24, Medium: 72, Low: 120 };
function computeExportTotals(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const subtotal = items.reduce((s, i) => s + (0, helpers_1.toNum)(i.qty) * (0, helpers_1.toNum)(i.unitPrice), 0);
    const weight = items.reduce((s, i) => s + (0, helpers_1.toNum)(i.qty) * (0, helpers_1.toNum)(i.weightKg, 1), 0);
    data.subtotal = subtotal.toFixed(2);
    data.totalWeightKg = weight.toFixed(3);
    data.total = (subtotal + (0, helpers_1.toNum)(data.shippingFee) + (0, helpers_1.toNum)(data.otherCharges)).toFixed(2);
}
function brandModulesRouter() {
    const r = (0, express_1.Router)();
    r.use('/travel/cases', (0, recordRouter_1.buildRecordRouter)({
        model: 'TravelCase', entity: 'travel_case', label: 'Travel case', codeSuffix: 'CASE', defaultBrand: 'VM',
        searchFields: ['customerName', 'customerEmail', 'customerPhone', 'passportNumber', 'destinationCountry'],
        filterFields: ['stage', 'serviceType', 'priority', 'destinationCountry'], stages: exports.STAGES.travelCase,
        actionUrl: (row) => `/visamax/cases?open=${row.id}`,
        beforeSave: (data, existing) => {
            if (!existing && !data.checklist)
                data.checklist = buildChecklist(data.serviceType, data.visaType);
        },
    }));
    r.patch('/travel/cases/:id(\\d+)/checklist', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.TravelCase.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Travel case not found');
        if (!(await (0, recordRouter_1.canManageRecord)(req, row)))
            return (0, recordRouter_1.fail)(res, 403, 'You cannot edit this case');
        if (!Array.isArray(req.body.checklist))
            return (0, recordRouter_1.fail)(res, 400, 'checklist must be an array');
        const before = (row.checklist || []).filter((c) => c.received).length;
        await row.update({ checklist: req.body.checklist });
        const after = req.body.checklist.filter((c) => c.received).length;
        if (after !== before)
            await (0, recordRouter_1.logActivity)(req, 'travel_case', row.id, row.departmentId, 'Document', `Documents received: ${after}/${req.body.checklist.length}`);
        (0, helpers_1.emitChange)(req, 'travel_case', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Checklist saved');
    }));
    r.post('/travel/cases/:id(\\d+)/regenerate-checklist', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.TravelCase.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Travel case not found');
        const existing = new Map((row.checklist || []).map((c) => [c.item, c]));
        const merged = buildChecklist(row.serviceType, row.visaType).map((c) => existing.get(c.item) || c);
        await row.update({ checklist: merged });
        return (0, recordRouter_1.ok)(res, row, 'Checklist updated');
    }));
    r.post('/travel/cases/:id(\\d+)/onboard', (0, recordRouter_1.wrap)(async (req, res) => {
        const row = await models_1.ErpModels.TravelCase.findByPk(req.params.id);
        if (!row)
            return (0, recordRouter_1.fail)(res, 404, 'Travel case not found');
        if (!row.customerEmail || !row.customerPhone)
            return (0, recordRouter_1.fail)(res, 400, 'Email and phone are required to onboard a customer');
        let clientId = row.clientId;
        if (!clientId) {
            const found = await helpers_1.db.query(`SELECT id FROM clients WHERE LOWER(email) = LOWER(:e) AND "deletedAt" IS NULL LIMIT 1`, { replacements: { e: row.customerEmail }, type: sequelize_1.QueryTypes.SELECT });
            if (found[0])
                clientId = found[0].id;
            else {
                const ins = await helpers_1.db.query(`INSERT INTO clients (uuid, "clientId", "fullName", email, phone, country, nationality, "dateOfBirth", "departmentId", "registrationDate", status, notes, "createdByUserId", "createdAt", "updatedAt")
           VALUES (:uuid, :code, :name, :email, :phone, :country, :nat, :dob, :dept, CURRENT_DATE, 'Active', :notes, :uid, NOW(), NOW()) RETURNING id`, { replacements: { uuid: (0, uuid_1.v4)(), code: `CL-${Date.now().toString(36).toUpperCase()}`.slice(0, 20), name: row.customerName, email: row.customerEmail, phone: row.customerPhone, country: row.customerCountry, nat: row.nationality, dob: row.dateOfBirth, dept: row.departmentId, notes: `Onboarded from ${row.code}`, uid: (0, helpers_1.userId)(req) }, type: sequelize_1.QueryTypes.SELECT });
                clientId = ins[0].id;
            }
        }
        const from = row.stage;
        const to = ['Inquiry', 'Consultation'].includes(from) ? 'Onboarding' : from;
        await row.update({ clientId, onboardingCompleted: true, stage: to });
        await (0, recordRouter_1.logActivity)(req, 'travel_case', row.id, row.departmentId, 'System', `Customer onboarded as client #${clientId}`);
        if (to !== from)
            await (0, recordRouter_1.logActivity)(req, 'travel_case', row.id, row.departmentId, 'StageChange', `${from} → ${to}`, { from, to });
        (0, helpers_1.emitChange)(req, 'travel_case', 'updated', row);
        return (0, recordRouter_1.ok)(res, row, 'Customer onboarded');
    }));
    r.use('/travel/bookings', (0, recordRouter_1.buildRecordRouter)({
        model: 'TravelBooking', entity: 'travel_booking', label: 'Booking', codeSuffix: 'BKG', defaultBrand: 'VM',
        searchFields: ['customerName', 'reference', 'provider', 'destination'], filterFields: ['status', 'bookingType', 'caseId'],
        stageField: 'status', stages: exports.STAGES.booking, actionUrl: () => '/visamax/bookings',
    }));
    r.use('/kurios/projects', (0, recordRouter_1.buildRecordRouter)({
        model: 'TechProject', entity: 'tech_project', label: 'Client project', codeSuffix: 'PRJ', defaultBrand: 'KS-ICT',
        searchFields: ['customerName', 'title', 'techStack'], filterFields: ['stage', 'projectType'], stages: exports.STAGES.techProject,
        actionUrl: (row) => `/kurios/solutions?open=${row.id}`,
        afterStage: async (row, _f, to) => { if (to === 'Deployed' || to === 'Completed')
            await row.update({ deliveredDate: row.deliveredDate || new Date(), progress: to === 'Completed' ? 100 : row.progress }); },
    }));
    r.use('/kurios/subscriptions', (0, recordRouter_1.buildRecordRouter)({
        model: 'ServiceSubscription', entity: 'service_subscription', label: 'Service subscription', codeSuffix: 'SUB', defaultBrand: 'KS-ICT',
        searchFields: ['customerName', 'name', 'provider'], filterFields: ['status', 'serviceType'], stageField: 'status', stages: exports.STAGES.subscription,
        actionUrl: () => '/kurios/solutions?tab=renewals',
    }));
    r.use('/support/tickets', (0, recordRouter_1.buildRecordRouter)({
        model: 'SupportTicket', entity: 'support_ticket', label: 'Support ticket', codeSuffix: 'TKT', defaultBrand: 'KS-ICT',
        searchFields: ['customerName', 'subject', 'customerEmail'], filterFields: ['status', 'priority', 'category', 'projectId'],
        stageField: 'status', stages: exports.STAGES.ticket, actionUrl: (row) => `/kurios/solutions?tab=tickets&open=${row.id}`,
        beforeSave: (data, existing) => {
            if (!existing || data.priority)
                data.slaDueAt = new Date(Date.now() + (SLA_HOURS[data.priority || existing?.priority || 'Medium'] || 72) * 3600000);
        },
        afterStage: async (row, _f, to) => { if (to === 'Resolved' || to === 'Closed')
            await row.update({ resolvedAt: row.resolvedAt || new Date() }); },
    }));
    r.use('/beadmax/custom-orders', (0, recordRouter_1.buildRecordRouter)({
        model: 'CustomOrder', entity: 'custom_order', label: 'Custom order', codeSuffix: 'ORD', defaultBrand: 'BM-DSN',
        searchFields: ['customerName', 'title', 'customerPhone'], filterFields: ['stage', 'itemType'], stages: exports.STAGES.customOrder,
        actionUrl: (row) => `/beadmax/custom-orders?open=${row.id}`,
        beforeSave: (data, existing) => {
            const qty = (0, helpers_1.toNum)(data.quantity ?? existing?.quantity, 1);
            const unit = (0, helpers_1.toNum)(data.unitPrice ?? existing?.unitPrice, 0);
            if (data.quantity !== undefined || data.unitPrice !== undefined || !existing)
                data.totalPrice = (qty * unit).toFixed(2);
        },
    }));
    r.use('/maxfood/products', (0, recordRouter_1.buildRecordRouter)({
        model: 'FoodProduct', entity: 'food_product', label: 'Product', codeSuffix: 'PRD', defaultBrand: 'MF',
        searchFields: ['name', 'category', 'nafdacNo'], filterFields: ['category', 'isActive'],
    }));
    r.use('/maxfood/orders', (0, recordRouter_1.buildRecordRouter)({
        model: 'ExportOrder', entity: 'export_order', label: 'Export order', codeSuffix: 'EXP', defaultBrand: 'MF',
        searchFields: ['customerName', 'destinationCountry', 'trackingNo', 'airwayBill', 'customerEmail'],
        filterFields: ['stage', 'destinationCountry', 'shippingMethod'], stages: exports.STAGES.exportOrder,
        actionUrl: (row) => `/maxfood?open=${row.id}`,
        beforeSave: (data, existing) => {
            if (data.items !== undefined || data.shippingFee !== undefined || data.otherCharges !== undefined) {
                const tmp = { items: data.items ?? existing?.items, shippingFee: data.shippingFee ?? existing?.shippingFee, otherCharges: data.otherCharges ?? existing?.otherCharges };
                computeExportTotals(tmp);
                Object.assign(data, { subtotal: tmp.subtotal, totalWeightKg: tmp.totalWeightKg, total: tmp.total });
            }
        },
        afterStage: async (row, _from, to, req) => {
            const meta = { ...(row.meta || {}) };
            if (to === 'Processing & Packaging' && !meta.stockDeducted) {
                for (const i of row.items || [])
                    if (i.productId)
                        await helpers_1.db.query(`UPDATE erp_food_products SET "stockQty" = "stockQty" - :q, "updatedAt" = NOW() WHERE id = :id`, { replacements: { q: (0, helpers_1.toNum)(i.qty), id: i.productId } });
                meta.stockDeducted = true;
                (0, helpers_1.emitChange)(req, 'food_product', 'updated');
            }
            if (to === 'Cancelled' && meta.stockDeducted) {
                for (const i of row.items || [])
                    if (i.productId)
                        await helpers_1.db.query(`UPDATE erp_food_products SET "stockQty" = "stockQty" + :q, "updatedAt" = NOW() WHERE id = :id`, { replacements: { q: (0, helpers_1.toNum)(i.qty), id: i.productId } });
                meta.stockDeducted = false;
            }
            const patch = { meta };
            if (to === 'Shipped' && !row.shipDate)
                patch.shipDate = new Date();
            if (to === 'Delivered')
                patch.deliveredAt = new Date();
            await row.update(patch);
        },
    }));
    return r;
}
//# sourceMappingURL=brandModules.js.map