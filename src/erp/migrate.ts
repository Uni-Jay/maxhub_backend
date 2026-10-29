import { QueryTypes, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { defineErpModels, ErpModels } from './models';
import { BRANDS, HEAD_OFFICE } from './brands';
import { DEFAULT_TEMPLATES } from './templates';

/**
 * Idempotent startup migrations for ERP v2.
 *
 * Safe by construction:
 *  - only CREATE TABLE IF NOT EXISTS for new erp_* tables,
 *  - only INSERT rows that are missing (departments, branch, brand profiles,
 *    templates, chat channels),
 *  - ALTER TYPE … ADD VALUE IF NOT EXISTS for enums that need a new brand code.
 * It never updates or deletes users, passwords, roles or staff records.
 * Each step is recorded in erp_migrations and failures are logged, not fatal.
 */
export async function runErpMigrations(sequelize: Sequelize): Promise<void> {
  if (process.env.ERP_MIGRATIONS === 'off') {
    console.log('ℹ️  ERP migrations disabled (ERP_MIGRATIONS=off)');
    return;
  }
  defineErpModels(sequelize);
  const q = (sql: string, replacements: any = {}) => sequelize.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
  const exec = (sql: string, replacements: any = {}) => sequelize.query(sql, { replacements });

  // 1. New tables only.
  for (const [name, model] of Object.entries(ErpModels)) {
    try { await model.sync(); } catch (e: any) { console.error(`[ERP] create table ${name} failed:`, e.message); }
  }

  const done = new Set((await q(`SELECT name FROM erp_migrations`)).map((r) => r.name));
  const step = async (name: string, fn: () => Promise<void>, always = false) => {
    if (!always && done.has(name)) return;
    try {
      await fn();
      if (!done.has(name)) await exec(`INSERT INTO erp_migrations (name, "ranAt") VALUES (:name, NOW()) ON CONFLICT DO NOTHING`, { name });
      console.log(`✅ [ERP] ${name}`);
    } catch (e: any) {
      console.error(`❌ [ERP] ${name}:`, e.message);
    }
  };

  // 2. Head Office branch (only if no branch with that code exists).
  await step('001-head-office-branch', async () => {
    const rows = await q(`SELECT id FROM branches WHERE "branchCode" = :c LIMIT 1`, { c: HEAD_OFFICE.branchCode });
    let id = rows[0]?.id;
    if (!id) {
      const any = await q(`SELECT id FROM branches WHERE "deletedAt" IS NULL ORDER BY id LIMIT 1`);
      if (any[0]) id = any[0].id; // an existing first branch is treated as the head office
      else {
        const ins = await q(
          `INSERT INTO branches (uuid, "branchCode", "branchName", country, state, city, address, phone, email, status, "createdAt", "updatedAt")
           VALUES (:uuid, :branchCode, :branchName, :country, :state, :city, :address, :phone, :email, 'Active', NOW(), NOW()) RETURNING id`,
          { uuid: uuidv4(), ...HEAD_OFFICE },
        );
        id = ins[0].id;
      }
    }
    await exec(
      `INSERT INTO erp_settings (key, value, "createdAt", "updatedAt") VALUES ('headOfficeBranchId', to_jsonb(:id::bigint), NOW(), NOW())
       ON CONFLICT (key) DO NOTHING`, { id },
    );
  });

  // 3. Brands as departments (+ sub-departments) and brand profiles.
  await step('002-brand-departments', async () => {
    for (const b of BRANDS) {
      let rows = await q(`SELECT id, name FROM departments WHERE UPPER(code) = :c LIMIT 1`, { c: b.code });
      if (!rows[0]) {
        rows = await q(
          `INSERT INTO departments (uuid, code, name, description, status, "createdAt", "updatedAt")
           VALUES (:uuid, :code, :name, :description, 'Active', NOW(), NOW()) RETURNING id, name`,
          { uuid: uuidv4(), code: b.code, name: b.departmentName, description: b.description },
        );
      }
      const parentId = rows[0].id;
      for (const sd of b.subDepartments) {
        const ex = await q(`SELECT id FROM departments WHERE UPPER(code) = :c LIMIT 1`, { c: sd.code });
        if (!ex[0]) {
          await exec(
            `INSERT INTO departments (uuid, code, name, description, "parentDepartmentId", status, "createdAt", "updatedAt")
             VALUES (:uuid, :code, :name, :description, :parentId, 'Active', NOW(), NOW())`,
            { uuid: uuidv4(), code: sd.code, name: sd.name, description: sd.description, parentId },
          );
        }
      }
      const prof = await q(`SELECT id FROM erp_brand_profiles WHERE code = :c`, { c: b.code });
      if (!prof[0]) {
        await (ErpModels.BrandProfile as any).create({
          departmentId: parentId, code: b.code, displayName: b.displayName, tagline: b.tagline, description: b.description,
          website: b.website, email: b.email, phone: b.phone, whatsapp: b.whatsapp, address: b.address,
          logoUrl: b.logoPath, primaryColor: b.primaryColor, secondaryColor: b.secondaryColor, receiptPrefix: b.receiptPrefix,
        });
      }
    }
  });

  // 4. Enum values for the new brand code on job postings (public careers feed).
  await step('003-job-posting-mf-enum', async () => {
    const t = await q(`SELECT 1 FROM pg_type WHERE typname = 'enum_job_postings_businessUnit'`);
    if (t[0]) await exec(`ALTER TYPE "enum_job_postings_businessUnit" ADD VALUE IF NOT EXISTS 'MF'`);
  });

  // 5. Default terms, policies & agreement templates per brand.
  await step('004-default-document-templates', async () => {
    for (const tpl of DEFAULT_TEMPLATES) {
      const dep = await q(`SELECT id FROM departments WHERE UPPER(code) = :c LIMIT 1`, { c: tpl.code });
      if (!dep[0]) continue;
      const ex = await q(`SELECT id FROM erp_document_templates WHERE "departmentId" = :d AND title = :t`, { d: dep[0].id, t: tpl.title });
      if (ex[0]) continue;
      await (ErpModels.DocumentTemplate as any).create({
        departmentId: dep[0].id, title: tpl.title, category: tpl.category, body: tpl.body,
        requiresSignature: tpl.requiresSignature, isPublic: tpl.isPublic ?? false,
      });
    }
  });

  // 6. Company / department / branch chat channels (membership synced on every boot + login).
  await step('005-chat-channels', async () => {
    const { syncAllChannels } = require('./channels');
    await syncAllChannels();
  }, true);

  // 7. Merge the old VisaMax applications (visa_applicant) into the new
  //    customer pipeline so there is one place for VisaMax customers.
  //    The old table is left untouched; each row is copied once.
  await step('007-merge-legacy-visa-applications', async () => {
    const exists = await q(`SELECT to_regclass('visa_applicant') AS t`);
    if (!exists[0]?.t) return;
    const cols = new Set((await q(`SELECT column_name FROM information_schema.columns WHERE table_name = 'visa_applicant'`)).map((c) => c.column_name));
    const c = (snake: string, camel: string) => (cols.has(snake) ? `"${snake}"` : cols.has(camel) ? `"${camel}"` : 'NULL');
    const rows = await q(
      `SELECT id, ${c('client_code', 'clientCode')} AS code, ${c('first_name', 'firstName')} AS fn, ${c('last_name', 'lastName')} AS ln,
              email, phone, ${c('passport_number', 'passportNumber')} AS passport, ${c('visa_type', 'visaType')} AS visa,
              ${c('destination_country', 'destinationCountry')} AS dest, ${c('application_date', 'applicationDate')} AS applied,
              status, ${c('priority_level', 'priorityLevel')} AS priority, ${c('interview_scheduled', 'interviewScheduled')} AS interview,
              ${c('expected_decision_date', 'expectedDecisionDate')} AS decision, notes
       FROM visa_applicant WHERE ${c('deleted_at', 'deletedAt')} IS NULL`,
    );
    if (!rows.length) return;
    const vm = await q(`SELECT id FROM departments WHERE UPPER(code) = 'VM' LIMIT 1`);
    const already = new Set((await q(`SELECT (meta->>'legacyVisaApplicantId') AS id FROM erp_travel_cases WHERE meta ? 'legacyVisaApplicantId'`)).map((r) => String(r.id)));
    const STAGE: Record<string, string> = { New: 'Inquiry', 'In Progress': 'Application Submitted', 'Document Review': 'Documents Collection', Interview: 'Appointment / Biometrics', Approved: 'Approved', Rejected: 'Rejected', Cancelled: 'Closed' };
    const { nextCode } = require('./helpers');
    const { buildChecklist } = require('./routes/brandModules');
    let n = 0;
    for (const r of rows) {
      if (already.has(String(r.id))) continue;
      const raw = String(r.notes || '');
      const m = raw.match(/^__META__(.+?)\|\|/s);
      const meta: Record<string, string> = m ? Object.fromEntries(m[1].split(';').filter(Boolean).map((p: string) => { const i = p.indexOf(':'); return [p.slice(0, i), p.slice(i + 1)]; })) : {};
      const notes = (m ? raw.slice(m[0].length) : raw).trim();
      await (ErpModels.TravelCase as any).create({
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

  // 8. Indexes that help the new screens.
  await step('006-indexes', async () => {
    await exec(`CREATE INDEX IF NOT EXISTS erp_payments_dept_idx ON erp_payments ("departmentId", "paidAt")`);
    await exec(`CREATE INDEX IF NOT EXISTS erp_travel_cases_stage_idx ON erp_travel_cases (stage)`);
    await exec(`CREATE INDEX IF NOT EXISTS erp_export_orders_stage_idx ON erp_export_orders (stage)`);
    await exec(`CREATE INDEX IF NOT EXISTS erp_sigreq_status_idx ON erp_signature_requests (status)`);
  });
}
