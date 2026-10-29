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
    await step('006-indexes', async () => {
        await exec(`CREATE INDEX IF NOT EXISTS erp_payments_dept_idx ON erp_payments ("departmentId", "paidAt")`);
        await exec(`CREATE INDEX IF NOT EXISTS erp_travel_cases_stage_idx ON erp_travel_cases (stage)`);
        await exec(`CREATE INDEX IF NOT EXISTS erp_export_orders_stage_idx ON erp_export_orders (stage)`);
        await exec(`CREATE INDEX IF NOT EXISTS erp_sigreq_status_idx ON erp_signature_requests (status)`);
    });
}
//# sourceMappingURL=migrate.js.map