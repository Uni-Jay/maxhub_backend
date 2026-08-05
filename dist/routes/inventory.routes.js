"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("@middleware/AuthMiddleware");
const InventoryCategory_model_1 = require("@models/InventoryCategory.model");
const InventoryItem_model_1 = require("@models/InventoryItem.model");
const WarehouseStock_model_1 = require("@models/WarehouseStock.model");
const Warehouse_model_1 = require("@models/Warehouse.model");
const router = (0, express_1.Router)();
async function generateItemCode() {
    const last = await InventoryItem_model_1.InventoryItem.findOne({ order: [['id', 'DESC']], paranoid: false });
    const nextNum = last ? Number(last.id) + 1 : 1;
    return `ITM-${String(nextNum).padStart(6, '0')}`;
}
async function generateCategoryCode() {
    const last = await InventoryCategory_model_1.InventoryCategory.findOne({ order: [['id', 'DESC']], paranoid: false });
    const nextNum = last ? Number(last.id) + 1 : 1;
    return `CAT-${String(nextNum).padStart(4, '0')}`;
}
router.get('/categories', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { isActive, search, parentCategoryId } = req.query;
    const where = {};
    if (isActive !== undefined)
        where.isActive = isActive === 'true';
    if (parentCategoryId)
        where.parentCategoryId = parentCategoryId;
    if (search) {
        where[sequelize_1.Op.or] = [
            { categoryName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { categoryCode: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const categories = await InventoryCategory_model_1.InventoryCategory.findAll({
        where,
        order: [['categoryName', 'ASC']],
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, categories, 'Categories retrieved');
}));
router.post('/categories', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.create.all', 'inv.item.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { categoryName, description, parentCategoryId, isActive } = req.body;
    if (!categoryName) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'categoryName is required', 400);
    }
    if (parentCategoryId) {
        const parent = await InventoryCategory_model_1.InventoryCategory.findByPk(parentCategoryId);
        if (!parent) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'Parent category not found', 404);
        }
    }
    const categoryCode = await generateCategoryCode();
    const category = await InventoryCategory_model_1.InventoryCategory.create({
        categoryCode,
        categoryName,
        description,
        parentCategoryId,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, category, 'Category created successfully', 201);
}));
router.put('/categories/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.update.all', 'inv.item.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await InventoryCategory_model_1.InventoryCategory.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!category) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Category not found');
    }
    const { categoryName, description, parentCategoryId, isActive } = req.body;
    if (parentCategoryId && Number(parentCategoryId) === Number(category.id)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'A category cannot be its own parent', 400);
    }
    if (parentCategoryId) {
        const parent = await InventoryCategory_model_1.InventoryCategory.findByPk(parentCategoryId);
        if (!parent) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'Parent category not found', 404);
        }
    }
    await category.update({
        categoryName: categoryName ?? category.categoryName,
        description: description ?? category.description,
        parentCategoryId: parentCategoryId ?? category.parentCategoryId,
        isActive: isActive !== undefined ? Boolean(isActive) : category.isActive,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, category, 'Category updated successfully');
}));
router.delete('/categories/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.delete.all', 'inv.item.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await InventoryCategory_model_1.InventoryCategory.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!category) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Category not found');
    }
    const itemCount = await InventoryItem_model_1.InventoryItem.count({ where: { categoryId: category.id } });
    if (itemCount > 0) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot delete: ${itemCount} item(s) are assigned to this category`, 409);
    }
    const childCount = await InventoryCategory_model_1.InventoryCategory.count({ where: { parentCategoryId: category.id } });
    if (childCount > 0) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot delete: ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'} exist under this category`, 409);
    }
    await category.destroy();
    return ResponseFormatter_1.ResponseFormatter.success(res, null, 'Category deleted successfully');
}));
router.get('/items/low-stock', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { categoryId } = req.query;
    const itemWhere = { status: 'Active' };
    if (categoryId)
        itemWhere.categoryId = categoryId;
    const items = await InventoryItem_model_1.InventoryItem.findAll({
        where: itemWhere,
        order: [['itemName', 'ASC']],
    });
    if (items.length === 0) {
        return ResponseFormatter_1.ResponseFormatter.success(res, [], 'No items found');
    }
    const itemIds = items.map((i) => i.id);
    const stockSums = await WarehouseStock_model_1.WarehouseStock.findAll({
        attributes: [
            'itemId',
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quantity')), 'totalQty'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('availableQuantity')), 'totalAvailable'],
        ],
        where: { itemId: { [sequelize_1.Op.in]: itemIds } },
        group: ['itemId'],
        raw: true,
    });
    const stockMap = {};
    for (const row of stockSums) {
        stockMap[String(row.itemId)] = {
            totalQty: Number(row.totalQty) || 0,
            totalAvailable: Number(row.totalAvailable) || 0,
        };
    }
    const lowStockItems = items
        .map((item) => {
        const stock = stockMap[String(item.id)] ?? { totalQty: 0, totalAvailable: 0 };
        return {
            ...item.toJSON(),
            totalQty: stock.totalQty,
            totalAvailable: stock.totalAvailable,
            shortage: Math.max(0, item.reorderLevel - stock.totalQty),
        };
    })
        .filter((item) => item.totalQty < item.reorderLevel);
    return ResponseFormatter_1.ResponseFormatter.success(res, lowStockItems, `${lowStockItems.length} item(s) below reorder level`);
}));
router.get('/items', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'), AuthMiddleware_1.AuthMiddleware.pagination, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const { categoryId, status, search } = req.query;
    const where = {};
    if (categoryId)
        where.categoryId = categoryId;
    if (status)
        where.status = status;
    if (search) {
        where[sequelize_1.Op.or] = [
            { itemName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { itemCode: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { sku: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { description: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const { count, rows } = await InventoryItem_model_1.InventoryItem.findAndCountAll({
        where,
        include: [
            {
                model: InventoryCategory_model_1.InventoryCategory,
                as: 'category',
                attributes: ['id', 'categoryName', 'categoryCode'],
                required: false,
            },
        ],
        limit,
        offset,
        order: [['itemName', 'ASC']],
    });
    return ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, page, limit, 'Items retrieved');
}));
router.post('/items', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.create.all', 'inv.item.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { itemName, categoryId, description, sku, unitOfMeasure, unitCost, reorderLevel, reorderQuantity, status, isSerializable, isBatchable, } = req.body;
    if (!itemName || !categoryId || !unitOfMeasure || unitCost === undefined || reorderLevel === undefined || reorderQuantity === undefined) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'itemName, categoryId, unitOfMeasure, unitCost, reorderLevel, and reorderQuantity are required', 400);
    }
    const category = await InventoryCategory_model_1.InventoryCategory.findByPk(categoryId);
    if (!category) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Category not found', 404);
    }
    if (sku) {
        const dupeSku = await InventoryItem_model_1.InventoryItem.findOne({ where: { sku } });
        if (dupeSku) {
            return ResponseFormatter_1.ResponseFormatter.conflict(res, `SKU '${sku}' is already in use`);
        }
    }
    const itemCode = await generateItemCode();
    const item = await InventoryItem_model_1.InventoryItem.create({
        itemCode,
        itemName,
        categoryId,
        description,
        sku,
        unitOfMeasure,
        unitCost,
        reorderLevel,
        reorderQuantity,
        status: status || 'Active',
        isSerializable: Boolean(isSerializable),
        isBatchable: Boolean(isBatchable),
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, item, 'Inventory item created successfully', 201);
}));
router.get('/items/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await InventoryItem_model_1.InventoryItem.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
        include: [
            {
                model: InventoryCategory_model_1.InventoryCategory,
                as: 'category',
                attributes: ['id', 'categoryName', 'categoryCode'],
                required: false,
            },
        ],
    });
    if (!item) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Inventory item not found');
    }
    return ResponseFormatter_1.ResponseFormatter.success(res, item, 'Item retrieved');
}));
router.put('/items/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.update.all', 'inv.item.update.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await InventoryItem_model_1.InventoryItem.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!item) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Inventory item not found');
    }
    const { itemName, categoryId, description, sku, unitOfMeasure, unitCost, reorderLevel, reorderQuantity, status, isSerializable, isBatchable, } = req.body;
    if (categoryId) {
        const category = await InventoryCategory_model_1.InventoryCategory.findByPk(categoryId);
        if (!category) {
            return ResponseFormatter_1.ResponseFormatter.error(res, 'Category not found', 404);
        }
    }
    if (sku && sku !== item.sku) {
        const dupeSku = await InventoryItem_model_1.InventoryItem.findOne({ where: { sku } });
        if (dupeSku) {
            return ResponseFormatter_1.ResponseFormatter.conflict(res, `SKU '${sku}' is already in use by another item`);
        }
    }
    await item.update({
        itemName: itemName ?? item.itemName,
        categoryId: categoryId ?? item.categoryId,
        description: description ?? item.description,
        sku: sku ?? item.sku,
        unitOfMeasure: unitOfMeasure ?? item.unitOfMeasure,
        unitCost: unitCost ?? item.unitCost,
        reorderLevel: reorderLevel ?? item.reorderLevel,
        reorderQuantity: reorderQuantity ?? item.reorderQuantity,
        status: status ?? item.status,
        isSerializable: isSerializable !== undefined ? Boolean(isSerializable) : item.isSerializable,
        isBatchable: isBatchable !== undefined ? Boolean(isBatchable) : item.isBatchable,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, item, 'Inventory item updated successfully');
}));
router.delete('/items/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.delete.all', 'inv.item.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await InventoryItem_model_1.InventoryItem.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!item) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Inventory item not found');
    }
    const stockTotal = await WarehouseStock_model_1.WarehouseStock.sum('quantity', {
        where: { itemId: item.id },
    });
    if (stockTotal && Number(stockTotal) > 0) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Cannot delete: item has ${stockTotal} units in stock across warehouses`, 409);
    }
    await item.destroy();
    return ResponseFormatter_1.ResponseFormatter.success(res, null, 'Inventory item deleted successfully');
}));
router.get('/dashboard', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const [totalItems, activeItems] = await Promise.all([
        InventoryItem_model_1.InventoryItem.count(),
        InventoryItem_model_1.InventoryItem.count({ where: { status: 'Active' } }),
    ]);
    const stockAgg = await WarehouseStock_model_1.WarehouseStock.findAll({
        attributes: [
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quantity')), 'totalQty'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'stockRecords'],
        ],
        raw: true,
    });
    const totalQty = Number(stockAgg[0]?.totalQty ?? 0);
    const itemsForValue = await InventoryItem_model_1.InventoryItem.findAll({ attributes: ['id', 'unitCost'] });
    const stockRows = await WarehouseStock_model_1.WarehouseStock.findAll({ attributes: ['itemId', [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quantity')), 'qty']], group: ['itemId'], raw: true });
    const stockQtyMap = {};
    for (const r of stockRows)
        stockQtyMap[String(r.itemId)] = Number(r.qty) || 0;
    const totalValue = itemsForValue.reduce((sum, item) => sum + (stockQtyMap[String(item.id)] || 0) * Number(item.unitCost), 0);
    const lowStockItems = (await InventoryItem_model_1.InventoryItem.findAll({ where: { status: 'Active' } })).filter(item => {
        const qty = stockQtyMap[String(item.id)] || 0;
        return qty < Number(item.reorderLevel);
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, {
        totalItems,
        activeItems,
        totalQty,
        totalValue,
        lowStockCount: lowStockItems.length,
        outOfStockCount: lowStockItems.filter(i => (stockQtyMap[String(i.id)] || 0) === 0).length,
    }, 'Dashboard stats retrieved');
}));
const Supplier_model_1 = require("@models/Supplier.model");
const PurchaseOrder_model_1 = require("@models/PurchaseOrder.model");
router.get('/suppliers', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { search, status } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (search) {
        where[sequelize_1.Op.or] = [
            { supplierName: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { contactPerson: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const suppliers = await Supplier_model_1.Supplier.findAll({ where, order: [['supplierName', 'ASC']] });
    return ResponseFormatter_1.ResponseFormatter.success(res, suppliers, 'Suppliers retrieved');
}));
router.post('/suppliers', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { supplierName, contactPerson, phone, email, address, city, state, country, paymentTerms, rating, notes } = req.body;
    if (!supplierName)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'supplierName is required', 400);
    const last = await Supplier_model_1.Supplier.findOne({ order: [['id', 'DESC']], paranoid: false });
    const code = `SUP-${String(last ? Number(last.id) + 1 : 1).padStart(5, '0')}`;
    const supplier = await Supplier_model_1.Supplier.create({ supplierCode: code, supplierName, contactPerson, phone, email, address, city, state, country, paymentTerms, rating, notes, status: 'Active' });
    return ResponseFormatter_1.ResponseFormatter.success(res, supplier, 'Supplier created', 201);
}));
router.put('/suppliers/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const supplier = await Supplier_model_1.Supplier.findByPk(req.params.id);
    if (!supplier)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Supplier not found');
    await supplier.update(req.body);
    return ResponseFormatter_1.ResponseFormatter.success(res, supplier, 'Supplier updated');
}));
router.delete('/suppliers/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const supplier = await Supplier_model_1.Supplier.findByPk(req.params.id);
    if (!supplier)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Supplier not found');
    await supplier.destroy();
    return ResponseFormatter_1.ResponseFormatter.success(res, null, 'Supplier deleted');
}));
router.get('/purchase-orders', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { supplierId, status } = req.query;
    const where = {};
    if (supplierId)
        where.supplierId = supplierId;
    if (status)
        where.status = status;
    const pos = await PurchaseOrder_model_1.PurchaseOrder.findAll({
        where,
        include: [{ model: Supplier_model_1.Supplier, as: 'supplier', attributes: ['id', 'supplierName'], required: false }],
        order: [['poDate', 'DESC']],
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, pos, 'Purchase orders retrieved');
}));
router.post('/purchase-orders', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { supplierId, poDate, expectedDeliveryDate, subtotal, discount, tax, total, currency, notes } = req.body;
    if (!supplierId || !poDate || !expectedDeliveryDate || total === undefined) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'supplierId, poDate, expectedDeliveryDate, total are required', 400);
    }
    const last = await PurchaseOrder_model_1.PurchaseOrder.findOne({ order: [['id', 'DESC']], paranoid: false });
    const code = `PO-${String(last ? Number(last.id) + 1 : 1).padStart(6, '0')}`;
    const po = await PurchaseOrder_model_1.PurchaseOrder.create({
        poCode: code, supplierId, poDate: new Date(poDate), expectedDeliveryDate: new Date(expectedDeliveryDate),
        subtotal: subtotal ?? 0, discount: discount ?? 0, tax: tax ?? 0, total, currency: currency ?? 'NGN',
        status: 'Draft', notes, createdById: user.id,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, po, 'Purchase order created', 201);
}));
router.patch('/purchase-orders/:id/status', AuthMiddleware_1.AuthMiddleware.verifyToken, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const po = await PurchaseOrder_model_1.PurchaseOrder.findByPk(req.params.id);
    if (!po)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Purchase order not found');
    await po.update({ status: req.body.status });
    return ResponseFormatter_1.ResponseFormatter.success(res, po, 'Status updated');
}));
router.get('/stock/:itemId', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const item = await InventoryItem_model_1.InventoryItem.findOne({
        where: isNaN(Number(itemId)) ? { uuid: itemId } : { id: itemId },
    });
    if (!item) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Inventory item not found');
    }
    const stockRecords = await WarehouseStock_model_1.WarehouseStock.findAll({
        where: { itemId: item.id },
        include: [
            {
                model: Warehouse_model_1.Warehouse,
                as: 'warehouse',
                attributes: ['id', 'warehouseCode', 'warehouseName', 'city', 'isActive'],
                required: false,
            },
        ],
        order: [['warehouseId', 'ASC']],
    });
    const totals = stockRecords.reduce((acc, row) => ({
        totalQuantity: acc.totalQuantity + Number(row.quantity),
        totalReserved: acc.totalReserved + Number(row.reservedQuantity),
        totalAvailable: acc.totalAvailable + Number(row.availableQuantity),
    }), { totalQuantity: 0, totalReserved: 0, totalAvailable: 0 });
    return ResponseFormatter_1.ResponseFormatter.success(res, {
        item: {
            id: item.id,
            uuid: item.uuid,
            itemCode: item.itemCode,
            itemName: item.itemName,
            unitOfMeasure: item.unitOfMeasure,
            reorderLevel: item.reorderLevel,
        },
        stock: stockRecords,
        totals,
        isBelowReorderLevel: totals.totalQuantity < item.reorderLevel,
    }, 'Stock levels retrieved');
}));
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map