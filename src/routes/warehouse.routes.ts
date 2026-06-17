import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Warehouse } from '@models/Warehouse.model';
import { WarehouseStock } from '@models/WarehouseStock.model';
import { InventoryItem } from '@models/InventoryItem.model';
import { InventoryCategory } from '@models/InventoryCategory.model';
import { User } from '@models/User.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/warehouse — list warehouses
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20, isActive, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) where.warehouseName = { [Op.iLike]: `%${search}%` };

  const { count, rows } = await Warehouse.findAndCountAll({
    where, order: [['warehouseName', 'ASC']], limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/warehouse/stats/overview
router.get('/stats/overview', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, active, lowStockItems] = await Promise.all([
    Warehouse.count(),
    Warehouse.count({ where: { isActive: true } }),
    (WarehouseStock as any).count({ where: { isBelowReorderLevel: true } }),
  ]);
  ResponseFormatter.success(res, { total, active, lowStockItems });
}));

// GET /api/warehouse/:id — warehouse with stock summary
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await Warehouse.findOne({
    where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
  });
  if (!warehouse) return ResponseFormatter.error(res, 'Warehouse not found', 404);

  const [totalSkus, lowStockItems, stockData] = await Promise.all([
    WarehouseStock.count({ where: { warehouseId: warehouse.id } }),
    (WarehouseStock as any).count({ where: { warehouseId: warehouse.id, isBelowReorderLevel: true } }),
    WarehouseStock.sum('quantity' as any, { where: { warehouseId: warehouse.id } }),
  ]);

  ResponseFormatter.success(res, {
    ...warehouse.toJSON(),
    stockSummary: { totalSkus, lowStockItems, totalQuantity: stockData || 0 },
  });
}));

// POST /api/warehouse — create warehouse
router.post('/', AuthMiddleware.requirePermission('INV.WAREHOUSE.CREATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { warehouseCode, warehouseName, locationId, address, city, state, country, managerUserId, capacity } = req.body;
  if (!warehouseCode || !warehouseName || !locationId) {
    return ResponseFormatter.error(res, 'warehouseCode, warehouseName, locationId are required', 400);
  }

  const existing = await Warehouse.findOne({ where: { warehouseCode } });
  if (existing) return ResponseFormatter.error(res, 'Warehouse code already exists', 409);

  const count = await Warehouse.count();
  const autoCode = warehouseCode || `WH-${String(count + 1).padStart(6, '0')}`;

  const warehouse = await Warehouse.create({
    uuid: uuidv4(), warehouseCode: autoCode, warehouseName, locationId,
    address, city, state, country, managerUserId, capacity, isActive: true,
  } as any);
  ResponseFormatter.success(res, warehouse, 'Warehouse created', 201);
}));

// PUT /api/warehouse/:id
router.put('/:id', AuthMiddleware.requirePermission('INV.WAREHOUSE.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await Warehouse.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!warehouse) return ResponseFormatter.error(res, 'Warehouse not found', 404);

  const allowed = ['warehouseName', 'locationId', 'address', 'city', 'state', 'country', 'managerUserId', 'capacity', 'isActive'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await warehouse.update(updates);
  ResponseFormatter.success(res, warehouse, 'Warehouse updated');
}));

// DELETE /api/warehouse/:id
router.delete('/:id', AuthMiddleware.requirePermission('INV.WAREHOUSE.DELETE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await Warehouse.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!warehouse) return ResponseFormatter.error(res, 'Warehouse not found', 404);
  await warehouse.destroy();
  ResponseFormatter.success(res, null, 'Warehouse deleted');
}));

// GET /api/warehouse/:id/stock
router.get('/:id/stock', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await Warehouse.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!warehouse) return ResponseFormatter.error(res, 'Warehouse not found', 404);

  const stock = await WarehouseStock.findAll({
    where: { warehouseId: warehouse.id },
    include: [{ model: InventoryItem, as: 'item', include: [{ model: InventoryCategory, as: 'category', attributes: ['categoryName'] }] }],
    order: [['isBelowReorderLevel', 'DESC']],
  });
  ResponseFormatter.success(res, stock);
}));

// POST /api/warehouse/:id/stock — upsert stock entry
router.post('/:id/stock', AuthMiddleware.requirePermission('INV.WAREHOUSE.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await Warehouse.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!warehouse) return ResponseFormatter.error(res, 'Warehouse not found', 404);

  const { inventoryItemId, quantity, reorderLevel } = req.body;
  if (!inventoryItemId || quantity === undefined) {
    return ResponseFormatter.error(res, 'inventoryItemId and quantity are required', 400);
  }

  const item = await InventoryItem.findByPk(inventoryItemId);
  if (!item) return ResponseFormatter.error(res, 'Inventory item not found', 404);

  const rl = reorderLevel !== undefined ? Number(reorderLevel) : item.reorderLevel;
  const qty = Number(quantity);
  const isBelowReorderLevel = qty <= rl;

  const [stock, created] = await (WarehouseStock as any).findOrCreate({
    where: { warehouseId: warehouse.id, inventoryItemId },
    defaults: { warehouseId: warehouse.id, inventoryItemId, quantity: qty, reorderLevel: rl, isBelowReorderLevel },
  });

  if (!created) {
    await stock.update({ quantity: qty, reorderLevel: rl, isBelowReorderLevel });
  }

  ResponseFormatter.success(res, stock, created ? 'Stock entry created' : 'Stock updated', created ? 201 : 200);
}));

export default router;
