"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("../utils/idOrUuid");
const uuid_1 = require("uuid");
const Warehouse_model_1 = require("../models/Warehouse.model");
const WarehouseStock_model_1 = require("../models/WarehouseStock.model");
const InventoryItem_model_1 = require("../models/InventoryItem.model");
const InventoryCategory_model_1 = require("../models/InventoryCategory.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("../middleware/AuthMiddleware"));
const router = (0, express_1.Router)();
router.get('/', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, isActive, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (isActive !== undefined)
        where.isActive = isActive === 'true';
    if (search)
        where.warehouseName = { [sequelize_1.Op.iLike]: `%${search}%` };
    const { count, rows } = await Warehouse_model_1.Warehouse.findAndCountAll({
        where, order: [['warehouseName', 'ASC']], limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));
router.get('/stats/overview', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const [total, active, lowStockItems] = await Promise.all([
        Warehouse_model_1.Warehouse.count(),
        Warehouse_model_1.Warehouse.count({ where: { isActive: true } }),
        WarehouseStock_model_1.WarehouseStock.count({ where: { isBelowReorderLevel: true } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, { total, active, lowStockItems });
}));
router.get('/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const warehouse = await Warehouse_model_1.Warehouse.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
    });
    if (!warehouse)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Warehouse not found', 404);
    const [totalSkus, lowStockItems, stockData] = await Promise.all([
        WarehouseStock_model_1.WarehouseStock.count({ where: { warehouseId: warehouse.id } }),
        WarehouseStock_model_1.WarehouseStock.count({ where: { warehouseId: warehouse.id, isBelowReorderLevel: true } }),
        WarehouseStock_model_1.WarehouseStock.sum('quantity', { where: { warehouseId: warehouse.id } }),
    ]);
    ResponseFormatter_1.ResponseFormatter.success(res, {
        ...warehouse.toJSON(),
        stockSummary: { totalSkus, lowStockItems, totalQuantity: stockData || 0 },
    });
}));
router.post('/', AuthMiddleware_1.default.requirePermission('INV.WAREHOUSE.CREATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { warehouseCode, warehouseName, locationId, address, city, state, country, managerUserId, capacity } = req.body;
    if (!warehouseCode || !warehouseName || !locationId) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'warehouseCode, warehouseName, locationId are required', 400);
    }
    const existing = await Warehouse_model_1.Warehouse.findOne({ where: { warehouseCode } });
    if (existing)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Warehouse code already exists', 409);
    const count = await Warehouse_model_1.Warehouse.count();
    const autoCode = warehouseCode || `WH-${String(count + 1).padStart(6, '0')}`;
    const warehouse = await Warehouse_model_1.Warehouse.create({
        uuid: (0, uuid_1.v4)(), warehouseCode: autoCode, warehouseName, locationId,
        address, city, state, country, managerUserId, capacity, isActive: true,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, warehouse, 'Warehouse created', 201);
}));
router.put('/:id', AuthMiddleware_1.default.requirePermission('INV.WAREHOUSE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const warehouse = await Warehouse_model_1.Warehouse.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!warehouse)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Warehouse not found', 404);
    const allowed = ['warehouseName', 'locationId', 'address', 'city', 'state', 'country', 'managerUserId', 'capacity', 'isActive'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined)
        updates[k] = req.body[k]; });
    await warehouse.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, warehouse, 'Warehouse updated');
}));
router.delete('/:id', AuthMiddleware_1.default.requirePermission('INV.WAREHOUSE.DELETE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const warehouse = await Warehouse_model_1.Warehouse.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!warehouse)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Warehouse not found', 404);
    await warehouse.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Warehouse deleted');
}));
router.get('/:id/stock', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const warehouse = await Warehouse_model_1.Warehouse.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!warehouse)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Warehouse not found', 404);
    const stock = await WarehouseStock_model_1.WarehouseStock.findAll({
        where: { warehouseId: warehouse.id },
        include: [{ model: InventoryItem_model_1.InventoryItem, as: 'item', include: [{ model: InventoryCategory_model_1.InventoryCategory, as: 'category', attributes: ['categoryName'] }] }],
        order: [['isBelowReorderLevel', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, stock);
}));
router.post('/:id/stock', AuthMiddleware_1.default.requirePermission('INV.WAREHOUSE.UPDATE.ALL'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const warehouse = await Warehouse_model_1.Warehouse.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!warehouse)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Warehouse not found', 404);
    const { inventoryItemId, quantity, reorderLevel } = req.body;
    if (!inventoryItemId || quantity === undefined) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'inventoryItemId and quantity are required', 400);
    }
    const item = await InventoryItem_model_1.InventoryItem.findByPk(inventoryItemId);
    if (!item)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Inventory item not found', 404);
    const rl = reorderLevel !== undefined ? Number(reorderLevel) : item.reorderLevel;
    const qty = Number(quantity);
    const isBelowReorderLevel = qty <= rl;
    const [stock, created] = await WarehouseStock_model_1.WarehouseStock.findOrCreate({
        where: { warehouseId: warehouse.id, inventoryItemId },
        defaults: { warehouseId: warehouse.id, inventoryItemId, quantity: qty, reorderLevel: rl, isBelowReorderLevel },
    });
    if (!created) {
        await stock.update({ quantity: qty, reorderLevel: rl, isBelowReorderLevel });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, stock, created ? 'Stock entry created' : 'Stock updated', created ? 201 : 200);
}));
exports.default = router;
//# sourceMappingURL=warehouse.routes.js.map