"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHOP_ORDER_STAGES = exports.MAXFOOD_CATEGORIES = exports.BEADMAX_CATEGORIES = void 0;
exports.moveStock = moveStock;
exports.shopTotals = shopTotals;
exports.inventoryRouter = inventoryRouter;
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const models_1 = require("./models");
const recordRouter_1 = require("./recordRouter");
const helpers_1 = require("./helpers");
exports.BEADMAX_CATEGORIES = {
    'Finished product': ['Necklace', 'Bracelet', 'Earrings', 'Anklet', 'Bridal set', 'Waist beads', 'Bag', 'Hair accessory', 'Home décor', 'Other'],
    'Raw material': ['Beads', 'Crystals', 'Pearls', 'Wire', 'Thread', 'Clasps & findings', 'Packaging', 'Tools', 'Other'],
};
exports.MAXFOOD_CATEGORIES = ['Grains', 'Seeds & nuts', 'Spices', 'Dried fish & seafood', 'Oils', 'Flours & swallows', 'Snacks', 'Vegetables', 'Fruits', 'Other'];
exports.SHOP_ORDER_STAGES = ['New', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
const TABLE = {
    beadmax: { table: 'erp_shop_products', brand: 'BM' },
    maxfood: { table: 'erp_food_products', brand: 'MF' },
};
async function moveStock(req, brand, productId, change, reason, reference, note) {
    const table = brand === 'BM' ? 'erp_shop_products' : 'erp_food_products';
    const rows = await helpers_1.db.query(`UPDATE ${table} SET "stockQty" = "stockQty" + :c, "updatedAt" = NOW() WHERE id = :id RETURNING "stockQty", name, "reorderLevel"`, { replacements: { c: change, id: productId }, type: sequelize_1.QueryTypes.SELECT });
    const p = rows[0];
    if (!p)
        return null;
    await models_1.ErpModels.StockMovement.create({
        brand, productTable: table, productId, productName: p.name, change, balanceAfter: p.stockQty, reason, reference: reference || null, note: note || null,
        createdById: req ? (0, helpers_1.userId)(req) || null : null, createdByName: req ? (0, helpers_1.userName)(req) : 'Website',
    });
    if (change < 0 && Number(p.reorderLevel) > 0 && Number(p.stockQty) <= Number(p.reorderLevel) && Number(p.stockQty) - change > Number(p.reorderLevel)) {
        const dept = await helpers_1.db.query(`SELECT id FROM departments WHERE UPPER(code) = :c LIMIT 1`, { replacements: { c: brand }, type: sequelize_1.QueryTypes.SELECT });
        const ids = [...(await (0, helpers_1.departmentHeadUserIds)(dept[0]?.id)), ...(await (0, helpers_1.userIdsWithRoles)(['superadmin', 'admin']))];
        await (0, helpers_1.notifyUsers)(req, ids, {
            title: `Low stock: ${p.name}`, message: `Only ${Number(p.stockQty)} left (reorder level ${Number(p.reorderLevel)}).`,
            type: 'Alert', priority: 'High', actionUrl: brand === 'BM' ? '/beadmax/inventory' : '/maxfood?tab=products',
        });
    }
    (0, helpers_1.emitChange)(req, brand === 'BM' ? 'shop_product' : 'food_product', 'updated', { id: productId });
    return Number(p.stockQty);
}
function slugify(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 180);
}
function shopTotals(data) {
    const items = Array.isArray(data.items) ? data.items : [];
    const subtotal = items.reduce((t, i) => t + (0, helpers_1.toNum)(i.qty) * (0, helpers_1.toNum)(i.price), 0);
    data.subtotal = subtotal.toFixed(2);
    data.total = Math.max(0, subtotal + (0, helpers_1.toNum)(data.deliveryFee) - (0, helpers_1.toNum)(data.discount)).toFixed(2);
}
function inventoryRouter() {
    const r = (0, express_1.Router)();
    r.get('/beadmax/shop-settings', (0, recordRouter_1.wrap)(async (_req, res) => {
        const row = await models_1.ErpModels.Setting.findByPk('beadmaxShop', { raw: true }).catch(() => null);
        return (0, recordRouter_1.ok)(res, { deliveryFees: { Lagos: 3000, 'Other states': 6000, Pickup: 0 }, bank: null, paymentMethods: ['Bank transfer', 'Pay on delivery (Lagos only)'], ...(row?.value || {}) });
    }));
    r.put('/beadmax/shop-settings', (0, recordRouter_1.wrap)(async (req, res) => {
        if (!(0, helpers_1.isManagement)(req) && !['hod', 'accountant'].includes((0, helpers_1.roleOf)(req)))
            return (0, recordRouter_1.fail)(res, 403, 'Only management, the BeadMax head or Accounts can change shop settings');
        const b = req.body || {};
        const value = {
            deliveryFees: { Lagos: (0, helpers_1.toNum)(b.deliveryFees?.Lagos, 3000), 'Other states': (0, helpers_1.toNum)(b.deliveryFees?.['Other states'], 6000), Pickup: 0 },
            bank: b.bank ? { bankName: String(b.bank.bankName || '').slice(0, 100), accountName: String(b.bank.accountName || '').slice(0, 150), accountNumber: String(b.bank.accountNumber || '').replace(/\D/g, '').slice(0, 20) } : null,
            paymentMethods: Array.isArray(b.paymentMethods) ? b.paymentMethods.map(String).slice(0, 5) : ['Bank transfer', 'Pay on delivery (Lagos only)'],
        };
        await models_1.ErpModels.Setting.upsert({ key: 'beadmaxShop', value });
        return (0, recordRouter_1.ok)(res, value, 'Shop settings saved');
    }));
    r.get('/inventory/meta', (0, recordRouter_1.wrap)(async (_req, res) => (0, recordRouter_1.ok)(res, { beadmax: exports.BEADMAX_CATEGORIES, maxfood: exports.MAXFOOD_CATEGORIES, shopOrderStages: exports.SHOP_ORDER_STAGES })));
    r.use('/beadmax/products', (0, recordRouter_1.buildRecordRouter)({
        model: 'ShopProduct', entity: 'shop_product', label: 'Product', codeSuffix: 'PRD', defaultBrand: 'BM-DSN',
        searchFields: ['name', 'category', 'material', 'colour', 'code'], filterFields: ['kind', 'category', 'isPublished', 'isActive'],
        actionUrl: (row) => `/beadmax/inventory?open=${row.id}`,
        beforeSave: async (data, existing) => {
            if (existing)
                delete data.stockQty;
            if (data.name && (!existing || !existing.slug || data.name !== existing.name)) {
                let slug = slugify(data.name) || `item-${Date.now()}`;
                const clash = await helpers_1.db.query(`SELECT id FROM erp_shop_products WHERE slug = :s ${existing ? 'AND id <> :id' : ''} LIMIT 1`, { replacements: { s: slug, id: existing?.id || 0 }, type: sequelize_1.QueryTypes.SELECT });
                if (clash.length)
                    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
                data.slug = slug;
            }
            if (data.kind === 'Raw material')
                data.isPublished = false;
        },
    }));
    r.use('/beadmax/shop-orders', (0, recordRouter_1.buildRecordRouter)({
        model: 'ShopOrder', entity: 'shop_order', label: 'Shop order', codeSuffix: 'WEB', defaultBrand: 'BM-DSN',
        searchFields: ['customerName', 'customerPhone', 'customerEmail', 'code', 'trackingNo'], filterFields: ['stage', 'paymentStatus', 'source'],
        stages: exports.SHOP_ORDER_STAGES,
        actionUrl: (row) => `/beadmax/shop?open=${row.id}`,
        beforeSave: (data, existing) => {
            if (data.items !== undefined || data.deliveryFee !== undefined || data.discount !== undefined) {
                const tmp = { items: data.items ?? existing?.items, deliveryFee: data.deliveryFee ?? existing?.deliveryFee, discount: data.discount ?? existing?.discount };
                shopTotals(tmp);
                Object.assign(data, { subtotal: tmp.subtotal, total: tmp.total });
            }
        },
        afterStage: async (row, _from, to, req) => {
            const meta = { ...(row.meta || {}) };
            if (['Confirmed', 'Packed', 'Shipped', 'Delivered'].includes(to) && !meta.stockDeducted) {
                for (const i of row.items || [])
                    if (i.productId)
                        await moveStock(req, 'BM', Number(i.productId), -(0, helpers_1.toNum)(i.qty), 'Order', row.code);
                meta.stockDeducted = true;
            }
            if (to === 'Cancelled' && meta.stockDeducted) {
                for (const i of row.items || [])
                    if (i.productId)
                        await moveStock(req, 'BM', Number(i.productId), (0, helpers_1.toNum)(i.qty), 'Returned', row.code, 'Order cancelled');
                meta.stockDeducted = false;
            }
            const patch = { meta };
            if (to === 'Delivered' && row.paymentMethod === 'Pay on delivery' && row.paymentStatus === 'Unpaid')
                patch.paymentStatus = 'Paid';
            await row.update(patch);
            if (row.customerEmail && ['Confirmed', 'Shipped', 'Delivered', 'Cancelled'].includes(to)) {
                const { brandForDepartment, brandEmailHtml, sendBrandEmail, escapeHtml } = require('./outbound');
                const brand = await brandForDepartment(row.departmentId);
                const lines = {
                    Confirmed: 'We have confirmed your order and are getting it ready.',
                    Shipped: `Your order is on its way${row.trackingNo ? ` — tracking number <b>${escapeHtml(row.trackingNo)}</b>` : ''}.`,
                    Delivered: 'Your order has been delivered. Thank you for shopping with us!',
                    Cancelled: 'Your order has been cancelled. If you did not ask for this, please reply to this email.',
                };
                sendBrandEmail(brand, row.customerEmail, `Order ${row.code}: ${to}`, brandEmailHtml(brand, `Order ${row.code} — ${to}`, `<p>Hello ${escapeHtml(row.customerName)},</p><p>${lines[to]}</p>`)).catch(() => undefined);
            }
        },
    }));
    r.post('/:brand(beadmax|maxfood)/stock', (0, recordRouter_1.wrap)(async (req, res) => {
        const cfg = TABLE[req.params.brand];
        const productId = Number(req.body?.productId);
        const change = (0, helpers_1.toNum)(req.body?.change);
        const reason = String(req.body?.reason || '').slice(0, 60) || (change > 0 ? 'Restock' : 'Count correction');
        if (!productId || !change)
            return (0, recordRouter_1.fail)(res, 400, 'Choose a product and enter a quantity');
        const cur = await helpers_1.db.query(`SELECT "stockQty", name, "departmentId" FROM ${cfg.table} WHERE id = :id`, { replacements: { id: productId }, type: sequelize_1.QueryTypes.SELECT });
        if (!cur[0])
            return (0, recordRouter_1.fail)(res, 404, 'Product not found');
        if (Number(cur[0].stockQty) + change < 0)
            return (0, recordRouter_1.fail)(res, 400, `Only ${Number(cur[0].stockQty)} in stock`);
        const balance = await moveStock(req, cfg.brand, productId, change, reason, req.body?.reference, req.body?.note);
        await (0, recordRouter_1.logActivity)(req, cfg.brand === 'BM' ? 'shop_product' : 'food_product', productId, cur[0].departmentId, 'Note', `${reason}: ${change > 0 ? '+' : ''}${change} (now ${balance})`);
        return (0, recordRouter_1.ok)(res, { balance }, 'Stock updated');
    }));
    r.get('/:brand(beadmax|maxfood)/stock-movements', (0, recordRouter_1.wrap)(async (req, res) => {
        const cfg = TABLE[req.params.brand];
        const rows = await helpers_1.db.query(`SELECT * FROM erp_stock_movements WHERE "productTable" = :t ${req.query.productId ? 'AND "productId" = :p' : ''} ORDER BY "createdAt" DESC LIMIT 200`, { replacements: { t: cfg.table, p: Number(req.query.productId) || 0 }, type: sequelize_1.QueryTypes.SELECT });
        return (0, recordRouter_1.ok)(res, rows);
    }));
    r.get('/:brand(beadmax|maxfood)/inventory-summary', (0, recordRouter_1.wrap)(async (req, res) => {
        const cfg = TABLE[req.params.brand];
        const { rateToNgn } = require('./fx');
        const costCur = cfg.brand === 'BM' ? `currency` : `"costCurrency"`;
        const priceCol = cfg.brand === 'BM' ? 'price' : '"sellingPrice"';
        const rows = await helpers_1.db.query(`SELECT id, name, category, "stockQty", "reorderLevel", "costPrice", ${costCur} AS "costCurrency", ${priceCol} AS price, currency
       FROM ${cfg.table} WHERE "isActive" = true`, { type: sequelize_1.QueryTypes.SELECT });
        let costValue = 0;
        let saleValue = 0;
        for (const p of rows) {
            costValue += Number(p.stockQty) * Number(p.costPrice) * ((await rateToNgn(p.costCurrency)) || 0);
            saleValue += Number(p.stockQty) * Number(p.price) * ((await rateToNgn(p.currency)) || 0);
        }
        const low = rows.filter((p) => Number(p.reorderLevel) > 0 && Number(p.stockQty) <= Number(p.reorderLevel));
        const out = rows.filter((p) => Number(p.stockQty) <= 0);
        const canSeeCost = (0, helpers_1.isManagement)(req) || ['accountant', 'hod'].includes((0, helpers_1.roleOf)(req));
        return (0, recordRouter_1.ok)(res, {
            products: rows.length, units: rows.reduce((t, p) => t + Number(p.stockQty), 0),
            costValueNgn: canSeeCost ? Math.round(costValue) : null, saleValueNgn: Math.round(saleValue),
            lowStock: low.map((p) => ({ id: Number(p.id), name: p.name, stockQty: Number(p.stockQty), reorderLevel: Number(p.reorderLevel) })),
            outOfStock: out.length,
        });
    }));
    return r;
}
//# sourceMappingURL=inventory.js.map