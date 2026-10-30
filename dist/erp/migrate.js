"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runErpMigrations = runErpMigrations;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const models_1 = require("./models");
const brands_1 = require("./brands");
const templates_1 = require("./templates");
async function runErpMigrations(sequelize) {
    if (process.env.ERP_MIGRATIONS === 'off') {
        console.log('ℹ️  ERP migrations disabled (ERP_MIGRATIONS=off)');
        return;
    }
    (0, models_1.defineErpModels)(sequelize);
    const q = (sql, replacements = {}) => sequelize.query(sql, { replacements, type: sequelize_1.QueryTypes.SELECT });
    const exec = (sql, replacements = {}) => sequelize.query(sql, { replacements });
    for (const [name, model] of Object.entries(models_1.ErpModels)) {
        try {
            await model.sync();
        }
        catch (e) {
            console.error(`[ERP] create table ${name} failed:`, e.message);
        }
    }
    const done = new Set((await q(`SELECT name FROM erp_migrations`)).map((r) => r.name));
    const step = async (name, fn, always = false) => {
        if (!always && done.has(name))
            return;
        try {
            await fn();
            if (!done.has(name))
                await exec(`INSERT INTO erp_migrations (name, "ranAt") VALUES (:name, NOW()) ON CONFLICT DO NOTHING`, { name });
            console.log(`✅ [ERP] ${name}`);
        }
        catch (e) {
            console.error(`❌ [ERP] ${name}:`, e.message);
        }
    };
    await step('001-head-office-branch', async () => {
        const rows = await q(`SELECT id FROM branches WHERE "branchCode" = :c LIMIT 1`, { c: brands_1.HEAD_OFFICE.branchCode });
        let id = rows[0]?.id;
        if (!id) {
            const any = await q(`SELECT id FROM branches WHERE "deletedAt" IS NULL ORDER BY id LIMIT 1`);
            if (any[0])
                id = any[0].id;
            else {
                const ins = await q(`INSERT INTO branches (uuid, "branchCode", "branchName", country, state, city, address, phone, email, status, "createdAt", "updatedAt")
           VALUES (:uuid, :branchCode, :branchName, :country, :state, :city, :address, :phone, :email, 'Active', NOW(), NOW()) RETURNING id`, { uuid: (0, uuid_1.v4)(), ...brands_1.HEAD_OFFICE });
                id = ins[0].id;
            }
        }
        await exec(`INSERT INTO erp_settings (key, value, "createdAt", "updatedAt") VALUES ('headOfficeBranchId', to_jsonb(:id::bigint), NOW(), NOW())
       ON CONFLICT (key) DO NOTHING`, { id });
    });
    await step('002-brand-departments', async () => {
        for (const b of brands_1.BRANDS) {
            let rows = await q(`SELECT id, name FROM departments WHERE UPPER(code) = :c LIMIT 1`, { c: b.code });
            if (!rows[0]) {
                rows = await q(`INSERT INTO departments (uuid, code, name, description, status, "createdAt", "updatedAt")
           VALUES (:uuid, :code, :name, :description, 'Active', NOW(), NOW()) RETURNING id, name`, { uuid: (0, uuid_1.v4)(), code: b.code, name: b.departmentName, description: b.description });
            }
            const parentId = rows[0].id;
            for (const sd of b.subDepartments) {
                const ex = await q(`SELECT id FROM departments WHERE UPPER(code) = :c LIMIT 1`, { c: sd.code });
                if (!ex[0]) {
                    await exec(`INSERT INTO departments (uuid, code, name, description, "parentDepartmentId", status, "createdAt", "updatedAt")
             VALUES (:uuid, :code, :name, :description, :parentId, 'Active', NOW(), NOW())`, { uuid: (0, uuid_1.v4)(), code: sd.code, name: sd.name, description: sd.description, parentId });
                }
            }
            const prof = await q(`SELECT id FROM erp_brand_profiles WHERE code = :c`, { c: b.code });
            if (!prof[0]) {
                await models_1.ErpModels.BrandProfile.create({
                    departmentId: parentId, code: b.code, displayName: b.displayName, tagline: b.tagline, description: b.description,
                    website: b.website, email: b.email, phone: b.phone, whatsapp: b.whatsapp, address: b.address,
                    logoUrl: b.logoPath, primaryColor: b.primaryColor, secondaryColor: b.secondaryColor, receiptPrefix: b.receiptPrefix,
                });
            }
        }
    });
    await step('003-job-posting-mf-enum', async () => {
        const t = await q(`SELECT 1 FROM pg_type WHERE typname = 'enum_job_postings_businessUnit'`);
        if (t[0])
            await exec(`ALTER TYPE "enum_job_postings_businessUnit" ADD VALUE IF NOT EXISTS 'MF'`);
    });
    await step('004-default-document-templates', async () => {
        for (const tpl of templates_1.DEFAULT_TEMPLATES) {
            const dep = await q(`SELECT id FROM departments WHERE UPPER(code) = :c LIMIT 1`, { c: tpl.code });
            if (!dep[0])
                continue;
            const ex = await q(`SELECT id FROM erp_document_templates WHERE "departmentId" = :d AND title = :t`, { d: dep[0].id, t: tpl.title });
            if (ex[0])
                continue;
            await models_1.ErpModels.DocumentTemplate.create({
                departmentId: dep[0].id, title: tpl.title, category: tpl.category, body: tpl.body,
                requiresSignature: tpl.requiresSignature, isPublic: tpl.isPublic ?? false,
            });
        }
    });
    await step('005-chat-channels', async () => {
        const { syncAllChannels } = require('./channels');
        await syncAllChannels();
    }, true);
    await step('007-merge-legacy-visa-applications', async () => {
        const exists = await q(`SELECT to_regclass('visa_applicant') AS t`);
        if (!exists[0]?.t)
            return;
        const cols = new Set((await q(`SELECT column_name FROM information_schema.columns WHERE table_name = 'visa_applicant'`)).map((c) => c.column_name));
        const c = (snake, camel) => (cols.has(snake) ? `"${snake}"` : cols.has(camel) ? `"${camel}"` : 'NULL');
        const rows = await q(`SELECT id, ${c('client_code', 'clientCode')} AS code, ${c('first_name', 'firstName')} AS fn, ${c('last_name', 'lastName')} AS ln,
              email, phone, ${c('passport_number', 'passportNumber')} AS passport, ${c('visa_type', 'visaType')} AS visa,
              ${c('destination_country', 'destinationCountry')} AS dest, ${c('application_date', 'applicationDate')} AS applied,
              status, ${c('priority_level', 'priorityLevel')} AS priority, ${c('interview_scheduled', 'interviewScheduled')} AS interview,
              ${c('expected_decision_date', 'expectedDecisionDate')} AS decision, notes
       FROM visa_applicant WHERE ${c('deleted_at', 'deletedAt')} IS NULL`);
        if (!rows.length)
            return;
        const vm = await q(`SELECT id FROM departments WHERE UPPER(code) = 'VM' LIMIT 1`);
        const already = new Set((await q(`SELECT (meta->>'legacyVisaApplicantId') AS id FROM erp_travel_cases WHERE meta ? 'legacyVisaApplicantId'`)).map((r) => String(r.id)));
        const STAGE = { New: 'Inquiry', 'In Progress': 'Application Submitted', 'Document Review': 'Documents Collection', Interview: 'Appointment / Biometrics', Approved: 'Approved', Rejected: 'Rejected', Cancelled: 'Closed' };
        const { nextCode } = require('./helpers');
        const { buildChecklist } = require('./routes/brandModules');
        let n = 0;
        for (const r of rows) {
            if (already.has(String(r.id)))
                continue;
            const raw = String(r.notes || '');
            const m = raw.match(/^__META__(.+?)\|\|/s);
            const meta = m ? Object.fromEntries(m[1].split(';').filter(Boolean).map((p) => { const i = p.indexOf(':'); return [p.slice(0, i), p.slice(i + 1)]; })) : {};
            const notes = (m ? raw.slice(m[0].length) : raw).trim();
            await models_1.ErpModels.TravelCase.create({
                code: await nextCode('VMX-CASE'),
                customerName: `${r.fn || ''} ${r.ln || ''}`.trim() || 'Customer',
                customerEmail: r.email || null, customerPhone: r.phone || null,
                passportNumber: r.passport || null, visaType: r.visa || null,
                serviceType: meta.serviceType || 'Visa Processing', destinationCountry: r.dest || null,
                stage: STAGE[r.status] || 'Inquiry', priority: r.priority || 'Medium',
                appointmentDate: r.interview || null, decisionDate: r.decision || null,
                departmentId: vm[0]?.id || null, onboardingCompleted: true,
                notes: [notes, meta.assignedTo ? `Assigned to: ${meta.assignedTo}` : '', r.code ? `Old client code: ${r.code}` : ''].filter(Boolean).join('\n') || null,
                checklist: ['Approved', 'Rejected', 'Closed'].includes(STAGE[r.status] || '') ? [] : buildChecklist(meta.serviceType || 'Visa Processing', r.visa),
                meta: { legacyVisaApplicantId: String(r.id), legacyClientCode: r.code || null },
                createdAt: r.applied || undefined,
            });
            n++;
        }
        console.log(`   [ERP] merged ${n} VisaMax application(s) into Customers & Applications`);
    });
    await step('008-accountant-role', async () => {
        const { RoleCode, ROLE_PERMISSIONS, ROLE_DESCRIPTIONS } = require('../config/RolesConfig');
        await exec(`INSERT INTO roles (uuid, code, name, description, "isSystemRole", "isActive", "createdAt", "updatedAt")
       VALUES (:uuid, 'accountant', 'Accountant', :desc, true, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`, { uuid: (0, uuid_1.v4)(), desc: ROLE_DESCRIPTIONS[RoleCode.ACCOUNTANT] });
        const role = (await q(`SELECT id FROM roles WHERE code = 'accountant'`))[0];
        if (!role)
            return;
        for (const code of ROLE_PERMISSIONS[RoleCode.ACCOUNTANT]) {
            const [module, resource, action, scope] = String(code).split('.');
            await exec(`INSERT INTO permissions (uuid, code, name, module, resource, action, scope, "isActive", "createdAt", "updatedAt")
         VALUES (:uuid, :code, :name, :module, :resource, :action, :scope, true, NOW(), NOW()) ON CONFLICT (code) DO NOTHING`, { uuid: (0, uuid_1.v4)(), code, name: code, module: module || 'fin', resource: resource || 'general', action: action || 'read', scope: scope || 'all' });
            await exec(`INSERT INTO role_permissions (uuid, "roleId", "permissionId", "createdAt", "updatedAt")
         SELECT :uuid, :r, p.id, NOW(), NOW() FROM permissions p WHERE p.code = :code
         ON CONFLICT ("roleId", "permissionId") DO NOTHING`, { uuid: (0, uuid_1.v4)(), r: role.id, code });
        }
        const accountants = await q(`SELECT DISTINCT s."userId" FROM staff s WHERE s."deletedAt" IS NULL AND s."userId" IS NOT NULL
         AND (s.position ILIKE '%accountant%' OR s."jobTitle" ILIKE '%accountant%')`);
        for (const a of accountants) {
            await exec(`INSERT INTO user_roles (uuid, "userId", "roleId", "assignedAt", "createdAt", "updatedAt")
         VALUES (:uuid, :u, :r, NOW(), NOW(), NOW()) ON CONFLICT ("userId", "roleId") DO NOTHING`, { uuid: (0, uuid_1.v4)(), u: a.userId, r: role.id });
        }
        console.log(`   [ERP] accountant role ready (${accountants.length} accountant(s) linked)`);
    });
    await step('009-all-staff-all-brands', async () => {
        const n = await require('./people').ensureAllStaffInAllBrands();
        console.log(`   [ERP] ${n} staff linked to every brand`);
    });
    await step('010-maxfood-logo', async () => {
        await exec(`UPDATE erp_brand_profiles SET "logoUrl" = '/brands/maxfood.jpeg', "updatedAt" = NOW()
       WHERE code = 'MF' AND ("logoUrl" IS NULL OR "logoUrl" = '' OR "logoUrl" = '/brands/maxfood.svg')`);
        await exec(`UPDATE erp_brand_profiles SET "primaryColor" = '#1b5e20', "secondaryColor" = '#e09200', "updatedAt" = NOW()
       WHERE code = 'MF' AND ("primaryColor" IS NULL OR "primaryColor" = '#2f7d32')`);
    });
    await step('011-fx-and-food-columns', async () => {
        await exec(`ALTER TABLE erp_payments ADD COLUMN IF NOT EXISTS "fxRate" DECIMAL(14,4)`);
        await exec(`ALTER TABLE erp_payments ADD COLUMN IF NOT EXISTS "amountNgn" DECIMAL(15,2)`);
        await exec(`UPDATE erp_payments SET "amountNgn" = amount, "fxRate" = 1 WHERE currency = 'NGN' AND "amountNgn" IS NULL`);
        for (const [col, type] of [['packSize', 'VARCHAR(60)'], ['originState', 'VARCHAR(80)'], ['batchNo', 'VARCHAR(60)'], ['harvestDate', 'DATE'], ['expiryDate', 'DATE'], ['storageCondition', 'VARCHAR(80)'], ['warehouse', 'VARCHAR(120)']]) {
            await exec(`ALTER TABLE erp_food_products ADD COLUMN IF NOT EXISTS "${col}" ${type}`);
        }
    });
    await step('012-payroll-period-paid-cancelled', async () => {
        const t = await q(`SELECT 1 FROM pg_type WHERE typname = 'enum_payroll_periods_status'`);
        if (!t.length)
            return;
        await exec(`ALTER TYPE "enum_payroll_periods_status" ADD VALUE IF NOT EXISTS 'Paid'`);
        await exec(`ALTER TYPE "enum_payroll_periods_status" ADD VALUE IF NOT EXISTS 'Cancelled'`);
    });
    await step('013-job-application-hired', async () => {
        const t = await q(`SELECT 1 FROM pg_type WHERE typname = 'enum_job_applications_status'`);
        if (t.length)
            await exec(`ALTER TYPE "enum_job_applications_status" ADD VALUE IF NOT EXISTS 'Hired'`);
    });
    await step('014-client-file-numbers', async () => {
        const t = await q(`SELECT 1 FROM information_schema.tables WHERE table_name = 'clients'`);
        if (!t.length)
            return;
        const { brandPrefix } = require('./recordRouter');
        const rows = await q(`SELECT id, "clientId", "departmentId", notes,
                                 EXTRACT(YEAR FROM COALESCE("registrationDate"::timestamptz, "createdAt"))::int AS yr
                          FROM clients ORDER BY COALESCE("registrationDate"::timestamptz, "createdAt"), "createdAt", id`);
        if (!rows.length)
            return;
        const hasContacts = (await q(`SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts'`)).length > 0;
        const prefixes = new Map();
        const counters = new Map();
        const plan = [];
        for (const r of rows) {
            const dk = String(r.departmentId ?? '');
            if (!prefixes.has(dk))
                prefixes.set(dk, await brandPrefix(r.departmentId).catch(() => 'MXH'));
            const key = `${prefixes.get(dk)}-CLT:${r.yr}`;
            const n = (counters.get(key) || 0) + 1;
            counters.set(key, n);
            plan.push({ id: r.id, old: r.clientId, code: `${prefixes.get(dk)}-CLT-${r.yr}-${String(n).padStart(4, '0')}`, notes: r.notes });
        }
        await sequelize.transaction(async (tx) => {
            const run = (sql, replacements) => sequelize.query(sql, { replacements, transaction: tx });
            await run(`UPDATE clients SET "clientId" = 'TMP-' || id::text`, {});
            if (hasContacts) {
                for (const p of plan) {
                    if (p.old && p.old !== p.code)
                        await run(`UPDATE contacts SET "contactCode" = :tmp WHERE "contactCode" = :oc`, { tmp: `TMPC-${p.id}`, oc: `CTK-${p.old}` });
                }
            }
            for (const p of plan) {
                const changed = p.old && p.old !== p.code;
                const notes = changed ? `${p.notes ? `${p.notes}\n` : ''}Previous file no: ${p.old}` : p.notes;
                await run(`UPDATE clients SET "clientId" = :code, notes = :notes, "updatedAt" = NOW() WHERE id = :id`, { code: p.code, notes, id: p.id });
                if (changed && hasContacts)
                    await run(`UPDATE contacts SET "contactCode" = :nc WHERE "contactCode" = :tmp`, { nc: `CTK-${p.code}`, tmp: `TMPC-${p.id}` });
            }
            for (const [key, n] of counters) {
                const [prefixClt, yr] = key.split(':');
                await run(`INSERT INTO erp_settings (key, value, "createdAt", "updatedAt") VALUES (:k, to_jsonb(:n::int), NOW(), NOW())
                   ON CONFLICT (key) DO UPDATE SET value = to_jsonb(GREATEST((erp_settings.value::text)::int, :n::int)), "updatedAt" = NOW()`, { k: `counter:${prefixClt}:${yr}`, n });
            }
        });
        console.log(`[ERP] renumbered ${plan.length} client(s)`);
    });
    await step('006-indexes', async () => {
        await exec(`CREATE INDEX IF NOT EXISTS erp_payments_dept_idx ON erp_payments ("departmentId", "paidAt")`);
        await exec(`CREATE INDEX IF NOT EXISTS erp_travel_cases_stage_idx ON erp_travel_cases (stage)`);
        await exec(`CREATE INDEX IF NOT EXISTS erp_export_orders_stage_idx ON erp_export_orders (stage)`);
        await exec(`CREATE INDEX IF NOT EXISTS erp_sigreq_status_idx ON erp_signature_requests (status)`);
    });
}
//# sourceMappingURL=migrate.js.map