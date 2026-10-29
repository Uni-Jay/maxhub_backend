import { Router, Request } from 'express';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ErpModels } from '../models';
import { buildRecordRouter, wrap, ok, fail, canManageRecord, logActivity } from '../recordRouter';
import { db, emitChange, toNum, userId } from '../helpers';

// ── Pipelines ────────────────────────────────────────────────────────────────
export const STAGES = {
  travelCase: ['Inquiry', 'Consultation', 'Onboarding', 'Documents Collection', 'Application Submitted', 'Appointment / Biometrics', 'Awaiting Decision', 'Approved', 'Rejected', 'Travelled', 'Closed'],
  booking: ['Quoted', 'Reserved', 'Ticketed', 'Confirmed', 'Completed', 'Cancelled'],
  techProject: ['Lead', 'Requirement Gathering', 'Proposal Sent', 'Contract Signed', 'Design', 'Development', 'Testing', 'Deployed', 'Maintenance', 'Completed', 'Cancelled'],
  subscription: ['Active', 'Expiring', 'Expired', 'Cancelled'],
  ticket: ['Open', 'In Progress', 'Waiting on Client', 'Resolved', 'Closed'],
  customOrder: ['Request', 'Design', 'Awaiting Deposit', 'Approved', 'Production', 'Quality Check', 'Ready', 'Delivered', 'Cancelled'],
  exportOrder: ['Order Received', 'Payment Confirmed', 'Sourcing', 'Processing & Packaging', 'Documentation', 'Customs Clearance', 'Shipped', 'In Transit', 'Arrived Destination', 'Delivered', 'Cancelled'],
};

// ── VisaMax document checklists ─────────────────────────────────────────────
const BASE_DOCS = ['International passport (valid 6+ months, 2 blank pages)', 'Recent passport photographs', 'Completed application form', 'Bank statement (last 6 months)', 'Employment letter / business registration (CAC)', 'Flight reservation / itinerary', 'Hotel booking or invitation letter', 'Travel insurance'];
const EXTRA_DOCS: Record<string, string[]> = {
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

export function buildChecklist(serviceType?: string, visaType?: string) {
  const list = BOOKING_ONLY.includes(serviceType || '')
    ? ['International passport data page', 'Travel dates & route', 'Passenger details (name as on passport, date of birth)']
    : [...BASE_DOCS, ...(EXTRA_DOCS[visaType || ''] || EXTRA_DOCS[serviceType || ''] || [])];
  return [...new Set(list)].map((item) => ({ item, required: true, received: false, fileUrl: null, note: '' }));
}

const SLA_HOURS: Record<string, number> = { Urgent: 4, High: 24, Medium: 72, Low: 120 };

function computeExportTotals(data: any) {
  const items = Array.isArray(data.items) ? data.items : [];
  const subtotal = items.reduce((s: number, i: any) => s + toNum(i.qty) * toNum(i.unitPrice), 0);
  const weight = items.reduce((s: number, i: any) => s + toNum(i.qty) * toNum(i.weightKg, 1), 0);
  data.subtotal = subtotal.toFixed(2);
  data.totalWeightKg = weight.toFixed(3);
  data.total = (subtotal + toNum(data.shippingFee) + toNum(data.otherCharges)).toFixed(2);
}

export function brandModulesRouter(): Router {
  const r = Router();

  // VisaMax — travel cases
  r.use('/travel/cases', buildRecordRouter({
    model: 'TravelCase', entity: 'travel_case', label: 'Travel case', codeSuffix: 'CASE', defaultBrand: 'VM',
    searchFields: ['customerName', 'customerEmail', 'customerPhone', 'passportNumber', 'destinationCountry'],
    filterFields: ['stage', 'serviceType', 'priority', 'destinationCountry'], stages: STAGES.travelCase,
    actionUrl: (row) => `/visamax/cases?open=${row.id}`,
    beforeSave: (data, existing) => {
      if (!existing && !data.checklist) data.checklist = buildChecklist(data.serviceType, data.visaType);
    },
  }));
  // Checklist ticks (received / file uploaded)
  r.patch('/travel/cases/:id(\\d+)/checklist', wrap(async (req, res) => {
    const row: any = await (ErpModels.TravelCase as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Travel case not found');
    if (!(await canManageRecord(req, row))) return fail(res, 403, 'You cannot edit this case');
    if (!Array.isArray(req.body.checklist)) return fail(res, 400, 'checklist must be an array');
    const before = (row.checklist || []).filter((c: any) => c.received).length;
    await row.update({ checklist: req.body.checklist });
    const after = req.body.checklist.filter((c: any) => c.received).length;
    if (after !== before) await logActivity(req, 'travel_case', row.id, row.departmentId, 'Document', `Documents received: ${after}/${req.body.checklist.length}`);
    emitChange(req, 'travel_case', 'updated', row);
    return ok(res, row, 'Checklist saved');
  }));
  r.post('/travel/cases/:id(\\d+)/regenerate-checklist', wrap(async (req, res) => {
    const row: any = await (ErpModels.TravelCase as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Travel case not found');
    const existing = new Map((row.checklist || []).map((c: any) => [c.item, c]));
    const merged = buildChecklist(row.serviceType, row.visaType).map((c) => existing.get(c.item) || c);
    await row.update({ checklist: merged });
    return ok(res, row, 'Checklist updated');
  }));
  // Onboard: turn an inquiry into a registered client (clients table) once.
  r.post('/travel/cases/:id(\\d+)/onboard', wrap(async (req, res) => {
    const row: any = await (ErpModels.TravelCase as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Travel case not found');
    if (!row.customerEmail || !row.customerPhone) return fail(res, 400, 'Email and phone are required to onboard a customer');
    let clientId = row.clientId;
    if (!clientId) {
      const found: any[] = await db.query(`SELECT id FROM clients WHERE LOWER(email) = LOWER(:e) AND "deletedAt" IS NULL LIMIT 1`, { replacements: { e: row.customerEmail }, type: QueryTypes.SELECT });
      if (found[0]) clientId = found[0].id;
      else {
        const ins: any[] = await db.query(
          `INSERT INTO clients (uuid, "clientId", "fullName", email, phone, country, nationality, "dateOfBirth", "departmentId", "registrationDate", status, notes, "createdByUserId", "createdAt", "updatedAt")
           VALUES (:uuid, :code, :name, :email, :phone, :country, :nat, :dob, :dept, CURRENT_DATE, 'Active', :notes, :uid, NOW(), NOW()) RETURNING id`,
          { replacements: { uuid: uuidv4(), code: `CL-${Date.now().toString(36).toUpperCase()}`.slice(0, 20), name: row.customerName, email: row.customerEmail, phone: row.customerPhone, country: row.customerCountry, nat: row.nationality, dob: row.dateOfBirth, dept: row.departmentId, notes: `Onboarded from ${row.code}`, uid: userId(req) }, type: QueryTypes.SELECT },
        );
        clientId = ins[0].id;
      }
    }
    const from = row.stage;
    const to = ['Inquiry', 'Consultation'].includes(from) ? 'Onboarding' : from;
    await row.update({ clientId, onboardingCompleted: true, stage: to });
    await logActivity(req, 'travel_case', row.id, row.departmentId, 'System', `Customer onboarded as client #${clientId}`);
    if (to !== from) await logActivity(req, 'travel_case', row.id, row.departmentId, 'StageChange', `${from} → ${to}`, { from, to });
    emitChange(req, 'travel_case', 'updated', row);
    return ok(res, row, 'Customer onboarded');
  }));

  r.use('/travel/bookings', buildRecordRouter({
    model: 'TravelBooking', entity: 'travel_booking', label: 'Booking', codeSuffix: 'BKG', defaultBrand: 'VM',
    searchFields: ['customerName', 'reference', 'provider', 'destination'], filterFields: ['status', 'bookingType', 'caseId'],
    stageField: 'status', stages: STAGES.booking, actionUrl: () => '/visamax/bookings',
  }));

  // Kurios SAT — ICT Solutions
  r.use('/kurios/projects', buildRecordRouter({
    model: 'TechProject', entity: 'tech_project', label: 'Client project', codeSuffix: 'PRJ', defaultBrand: 'KS-ICT',
    searchFields: ['customerName', 'title', 'techStack'], filterFields: ['stage', 'projectType'], stages: STAGES.techProject,
    actionUrl: (row) => `/kurios/solutions?open=${row.id}`,
    afterStage: async (row, _f, to) => { if (to === 'Deployed' || to === 'Completed') await row.update({ deliveredDate: row.deliveredDate || new Date(), progress: to === 'Completed' ? 100 : row.progress }); },
  }));
  r.use('/kurios/subscriptions', buildRecordRouter({
    model: 'ServiceSubscription', entity: 'service_subscription', label: 'Service subscription', codeSuffix: 'SUB', defaultBrand: 'KS-ICT',
    searchFields: ['customerName', 'name', 'provider'], filterFields: ['status', 'serviceType'], stageField: 'status', stages: STAGES.subscription,
    actionUrl: () => '/kurios/solutions?tab=renewals',
  }));
  // Tickets work for any brand (customer support); default to Kurios ICT.
  r.use('/support/tickets', buildRecordRouter({
    model: 'SupportTicket', entity: 'support_ticket', label: 'Support ticket', codeSuffix: 'TKT', defaultBrand: 'KS-ICT',
    searchFields: ['customerName', 'subject', 'customerEmail'], filterFields: ['status', 'priority', 'category', 'projectId'],
    stageField: 'status', stages: STAGES.ticket, actionUrl: (row) => `/kurios/solutions?tab=tickets&open=${row.id}`,
    beforeSave: (data, existing) => {
      if (!existing || data.priority) data.slaDueAt = new Date(Date.now() + (SLA_HOURS[data.priority || existing?.priority || 'Medium'] || 72) * 3600_000);
    },
    afterStage: async (row, _f, to) => { if (to === 'Resolved' || to === 'Closed') await row.update({ resolvedAt: row.resolvedAt || new Date() }); },
  }));

  // BeadMax Design — custom orders
  r.use('/beadmax/custom-orders', buildRecordRouter({
    model: 'CustomOrder', entity: 'custom_order', label: 'Custom order', codeSuffix: 'ORD', defaultBrand: 'BM-DSN',
    searchFields: ['customerName', 'title', 'customerPhone'], filterFields: ['stage', 'itemType'], stages: STAGES.customOrder,
    actionUrl: (row) => `/beadmax/custom-orders?open=${row.id}`,
    beforeSave: (data, existing) => {
      const qty = toNum(data.quantity ?? existing?.quantity, 1);
      const unit = toNum(data.unitPrice ?? existing?.unitPrice, 0);
      if (data.quantity !== undefined || data.unitPrice !== undefined || !existing) data.totalPrice = (qty * unit).toFixed(2);
    },
  }));

  // Maxfood Farm — products & export orders
  r.use('/maxfood/products', buildRecordRouter({
    model: 'FoodProduct', entity: 'food_product', label: 'Product', codeSuffix: 'PRD', defaultBrand: 'MF',
    searchFields: ['name', 'category', 'nafdacNo'], filterFields: ['category', 'isActive'],
  }));
  r.use('/maxfood/orders', buildRecordRouter({
    model: 'ExportOrder', entity: 'export_order', label: 'Export order', codeSuffix: 'EXP', defaultBrand: 'MF',
    searchFields: ['customerName', 'destinationCountry', 'trackingNo', 'airwayBill', 'customerEmail'],
    filterFields: ['stage', 'destinationCountry', 'shippingMethod'], stages: STAGES.exportOrder,
    actionUrl: (row) => `/maxfood?open=${row.id}`,
    beforeSave: (data, existing) => {
      if (data.items !== undefined || data.shippingFee !== undefined || data.otherCharges !== undefined) {
        const tmp: any = { items: data.items ?? existing?.items, shippingFee: data.shippingFee ?? existing?.shippingFee, otherCharges: data.otherCharges ?? existing?.otherCharges };
        computeExportTotals(tmp);
        Object.assign(data, { subtotal: tmp.subtotal, totalWeightKg: tmp.totalWeightKg, total: tmp.total });
      }
    },
    afterStage: async (row: any, _from, to, req: Request) => {
      const meta = { ...(row.meta || {}) };
      // Deduct stock once when packing starts; put it back if the order is cancelled afterwards.
      if (to === 'Processing & Packaging' && !meta.stockDeducted) {
        for (const i of row.items || []) if (i.productId) await db.query(`UPDATE erp_food_products SET "stockQty" = "stockQty" - :q, "updatedAt" = NOW() WHERE id = :id`, { replacements: { q: toNum(i.qty), id: i.productId } });
        meta.stockDeducted = true;
        emitChange(req, 'food_product', 'updated');
      }
      if (to === 'Cancelled' && meta.stockDeducted) {
        for (const i of row.items || []) if (i.productId) await db.query(`UPDATE erp_food_products SET "stockQty" = "stockQty" + :q, "updatedAt" = NOW() WHERE id = :id`, { replacements: { q: toNum(i.qty), id: i.productId } });
        meta.stockDeducted = false;
      }
      const patch: any = { meta };
      if (to === 'Shipped' && !row.shipDate) patch.shipDate = new Date();
      if (to === 'Delivered') patch.deliveredAt = new Date();
      await row.update(patch);
    },
  }));

  return r;
}
