import { Router, Request, Response } from 'express';
import { Op, fn, col } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { InventoryCategory } from '@models/InventoryCategory.model';
import { InventoryItem } from '@models/InventoryItem.model';
import { WarehouseStock } from '@models/WarehouseStock.model';
import { Warehouse } from '@models/Warehouse.model';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function generateItemCode(): Promise<string> {
  const last = await InventoryItem.findOne({ order: [['id', 'DESC']], paranoid: false });
  const nextNum = last ? Number(last.id) + 1 : 1;
  return `ITM-${String(nextNum).padStart(6, '0')}`;
}

async function generateCategoryCode(): Promise<string> {
  const last = await InventoryCategory.findOne({ order: [['id', 'DESC']], paranoid: false });
  const nextNum = last ? Number(last.id) + 1 : 1;
  return `CAT-${String(nextNum).padStart(4, '0')}`;
}

// ════════════════════════════════════════════════════════════════════════════
// CATEGORY ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /inventory/categories ───────────────────────────────────────────────
router.get(
  '/categories',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { isActive, search, parentCategoryId } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (parentCategoryId)       where.parentCategoryId = parentCategoryId;

    if (search) {
      where[Op.or as any] = [
        { categoryName: { [Op.iLike]: `%${search}%` } },
        { categoryCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const categories = await InventoryCategory.findAll({
      where,
      order: [['categoryName', 'ASC']],
    });

    return ResponseFormatter.success(res, categories, 'Categories retrieved');
  })
);

// ─── POST /inventory/categories ──────────────────────────────────────────────
router.post(
  '/categories',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.create.all', 'inv.item.create.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { categoryName, description, parentCategoryId, isActive } = req.body;

    if (!categoryName) {
      return ResponseFormatter.error(res, 'categoryName is required', 400);
    }

    // Validate parent if provided
    if (parentCategoryId) {
      const parent = await InventoryCategory.findByPk(parentCategoryId);
      if (!parent) {
        return ResponseFormatter.error(res, 'Parent category not found', 404);
      }
    }

    const categoryCode = await generateCategoryCode();

    const category = await InventoryCategory.create({
      categoryCode,
      categoryName,
      description,
      parentCategoryId,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return ResponseFormatter.success(res, category, 'Category created successfully', 201);
  })
);

// ─── PUT /inventory/categories/:id ───────────────────────────────────────────
router.put(
  '/categories/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.update.all', 'inv.item.update.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await InventoryCategory.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!category) {
      return ResponseFormatter.notFound(res, 'Category not found');
    }

    const { categoryName, description, parentCategoryId, isActive } = req.body;

    // Prevent circular parentage
    if (parentCategoryId && Number(parentCategoryId) === Number(category.id)) {
      return ResponseFormatter.error(res, 'A category cannot be its own parent', 400);
    }

    if (parentCategoryId) {
      const parent = await InventoryCategory.findByPk(parentCategoryId);
      if (!parent) {
        return ResponseFormatter.error(res, 'Parent category not found', 404);
      }
    }

    await category.update({
      categoryName:     categoryName     ?? category.categoryName,
      description:      description      ?? category.description,
      parentCategoryId: parentCategoryId ?? category.parentCategoryId,
      isActive:         isActive         !== undefined ? Boolean(isActive) : category.isActive,
    });

    return ResponseFormatter.success(res, category, 'Category updated successfully');
  })
);

// ─── DELETE /inventory/categories/:id ────────────────────────────────────────
router.delete(
  '/categories/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.delete.all', 'inv.item.delete.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await InventoryCategory.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!category) {
      return ResponseFormatter.notFound(res, 'Category not found');
    }

    // Check for items in this category
    const itemCount = await InventoryItem.count({ where: { categoryId: category.id } });
    if (itemCount > 0) {
      return ResponseFormatter.error(
        res,
        `Cannot delete: ${itemCount} item(s) are assigned to this category`,
        409
      );
    }

    // Check for child categories
    const childCount = await InventoryCategory.count({ where: { parentCategoryId: category.id } });
    if (childCount > 0) {
      return ResponseFormatter.error(
        res,
        `Cannot delete: ${childCount} sub-categor${childCount === 1 ? 'y' : 'ies'} exist under this category`,
        409
      );
    }

    await category.destroy();

    return ResponseFormatter.success(res, null, 'Category deleted successfully');
  })
);

// ════════════════════════════════════════════════════════════════════════════
// ITEM ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /inventory/items/low-stock ──────────────────────────────────────────
// Must be before /items/:id to avoid "low-stock" being parsed as an id
router.get(
  '/items/low-stock',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { categoryId } = req.query as Record<string, string>;

    // Find items where total stock across all warehouses < reorderLevel
    // We use a subquery approach: fetch items, then aggregate stock
    const itemWhere: Record<string, any> = { status: 'Active' };
    if (categoryId) itemWhere.categoryId = categoryId;

    const items = await InventoryItem.findAll({
      where: itemWhere,
      order: [['itemName', 'ASC']],
    });

    if (items.length === 0) {
      return ResponseFormatter.success(res, [], 'No items found');
    }

    const itemIds = items.map((i) => i.id);

    // Aggregate total quantity per item
    const stockSums = await WarehouseStock.findAll({
      attributes: [
        'itemId',
        [fn('SUM', col('quantity')), 'totalQty'],
        [fn('SUM', col('availableQuantity')), 'totalAvailable'],
      ],
      where: { itemId: { [Op.in]: itemIds } },
      group: ['itemId'],
      raw: true,
    }) as any[];

    const stockMap: Record<string, { totalQty: number; totalAvailable: number }> = {};
    for (const row of stockSums) {
      stockMap[String(row.itemId)] = {
        totalQty:       Number(row.totalQty)       || 0,
        totalAvailable: Number(row.totalAvailable) || 0,
      };
    }

    const lowStockItems = items
      .map((item) => {
        const stock = stockMap[String(item.id)] ?? { totalQty: 0, totalAvailable: 0 };
        return {
          ...item.toJSON(),
          totalQty:       stock.totalQty,
          totalAvailable: stock.totalAvailable,
          shortage:       Math.max(0, item.reorderLevel - stock.totalQty),
        };
      })
      .filter((item) => item.totalQty < item.reorderLevel);

    return ResponseFormatter.success(
      res,
      lowStockItems,
      `${lowStockItems.length} item(s) below reorder level`
    );
  })
);

// ─── GET /inventory/items ─────────────────────────────────────────────────────
router.get(
  '/items',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'),
  AuthMiddleware.pagination,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = req.pagination!;
    const { categoryId, status, search } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (categoryId) where.categoryId = categoryId;
    if (status)     where.status     = status;

    if (search) {
      where[Op.or as any] = [
        { itemName: { [Op.iLike]: `%${search}%` } },
        { itemCode: { [Op.iLike]: `%${search}%` } },
        { sku:      { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await InventoryItem.findAndCountAll({
      where,
      include: [
        {
          model:      InventoryCategory,
          as:         'category',
          attributes: ['id', 'categoryName', 'categoryCode'],
          required:   false,
        },
      ],
      limit,
      offset,
      order: [['itemName', 'ASC']],
    });

    return ResponseFormatter.paginated(res, rows, count, page, limit, 'Items retrieved');
  })
);

// ─── POST /inventory/items ────────────────────────────────────────────────────
router.post(
  '/items',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.create.all', 'inv.item.create.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      itemName, categoryId, description, sku,
      unitOfMeasure, unitCost, reorderLevel,
      reorderQuantity, status, isSerializable, isBatchable,
    } = req.body;

    if (!itemName || !categoryId || !unitOfMeasure || unitCost === undefined || reorderLevel === undefined || reorderQuantity === undefined) {
      return ResponseFormatter.error(
        res,
        'itemName, categoryId, unitOfMeasure, unitCost, reorderLevel, and reorderQuantity are required',
        400
      );
    }

    const category = await InventoryCategory.findByPk(categoryId);
    if (!category) {
      return ResponseFormatter.error(res, 'Category not found', 404);
    }

    if (sku) {
      const dupeSku = await InventoryItem.findOne({ where: { sku } });
      if (dupeSku) {
        return ResponseFormatter.conflict(res, `SKU '${sku}' is already in use`);
      }
    }

    const itemCode = await generateItemCode();

    const item = await InventoryItem.create({
      itemCode,
      itemName,
      categoryId,
      description,
      sku,
      unitOfMeasure,
      unitCost,
      reorderLevel,
      reorderQuantity,
      status:          status         || 'Active',
      isSerializable:  Boolean(isSerializable),
      isBatchable:     Boolean(isBatchable),
    });

    return ResponseFormatter.success(res, item, 'Inventory item created successfully', 201);
  })
);

// ─── GET /inventory/items/:id ─────────────────────────────────────────────────
router.get(
  '/items/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const item = await InventoryItem.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
      include: [
        {
          model:      InventoryCategory,
          as:         'category',
          attributes: ['id', 'categoryName', 'categoryCode'],
          required:   false,
        },
      ],
    });

    if (!item) {
      return ResponseFormatter.notFound(res, 'Inventory item not found');
    }

    return ResponseFormatter.success(res, item, 'Item retrieved');
  })
);

// ─── PUT /inventory/items/:id ─────────────────────────────────────────────────
router.put(
  '/items/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.update.all', 'inv.item.update.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const item = await InventoryItem.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!item) {
      return ResponseFormatter.notFound(res, 'Inventory item not found');
    }

    const {
      itemName, categoryId, description, sku,
      unitOfMeasure, unitCost, reorderLevel,
      reorderQuantity, status, isSerializable, isBatchable,
    } = req.body;

    if (categoryId) {
      const category = await InventoryCategory.findByPk(categoryId);
      if (!category) {
        return ResponseFormatter.error(res, 'Category not found', 404);
      }
    }

    if (sku && sku !== item.sku) {
      const dupeSku = await InventoryItem.findOne({ where: { sku } });
      if (dupeSku) {
        return ResponseFormatter.conflict(res, `SKU '${sku}' is already in use by another item`);
      }
    }

    await item.update({
      itemName:       itemName       ?? item.itemName,
      categoryId:     categoryId     ?? item.categoryId,
      description:    description    ?? item.description,
      sku:            sku            ?? item.sku,
      unitOfMeasure:  unitOfMeasure  ?? item.unitOfMeasure,
      unitCost:       unitCost       ?? item.unitCost,
      reorderLevel:   reorderLevel   ?? item.reorderLevel,
      reorderQuantity: reorderQuantity ?? item.reorderQuantity,
      status:          status         ?? item.status,
      isSerializable:  isSerializable !== undefined ? Boolean(isSerializable) : item.isSerializable,
      isBatchable:     isBatchable    !== undefined ? Boolean(isBatchable)    : item.isBatchable,
    });

    return ResponseFormatter.success(res, item, 'Inventory item updated successfully');
  })
);

// ─── DELETE /inventory/items/:id ──────────────────────────────────────────────
router.delete(
  '/items/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.delete.all', 'inv.item.delete.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const item = await InventoryItem.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!item) {
      return ResponseFormatter.notFound(res, 'Inventory item not found');
    }

    // Check active stock before deletion
    const stockTotal = await WarehouseStock.sum('quantity', {
      where: { itemId: item.id },
    });

    if (stockTotal && Number(stockTotal) > 0) {
      return ResponseFormatter.error(
        res,
        `Cannot delete: item has ${stockTotal} units in stock across warehouses`,
        409
      );
    }

    await item.destroy();

    return ResponseFormatter.success(res, null, 'Inventory item deleted successfully');
  })
);

// ════════════════════════════════════════════════════════════════════════════
// STOCK ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD ROUTE
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /inventory/dashboard ─────────────────────────────────────────────────
router.get(
  '/dashboard',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const [totalItems, activeItems] = await Promise.all([
      InventoryItem.count(),
      InventoryItem.count({ where: { status: 'Active' } }),
    ]);

    const stockAgg = await WarehouseStock.findAll({
      attributes: [
        [fn('SUM', col('quantity')), 'totalQty'],
        [fn('COUNT', col('id')), 'stockRecords'],
      ],
      raw: true,
    }) as any[];

    const totalQty = Number((stockAgg[0] as any)?.totalQty ?? 0);

    const itemsForValue = await InventoryItem.findAll({ attributes: ['id', 'unitCost'] });
    const stockRows = await WarehouseStock.findAll({ attributes: ['itemId', [fn('SUM', col('quantity')), 'qty']], group: ['itemId'], raw: true }) as any[];
    const stockQtyMap: Record<string, number> = {};
    for (const r of stockRows) stockQtyMap[String(r.itemId)] = Number(r.qty) || 0;
    const totalValue = itemsForValue.reduce((sum, item) => sum + (stockQtyMap[String(item.id)] || 0) * Number(item.unitCost), 0);

    const lowStockItems = (await InventoryItem.findAll({ where: { status: 'Active' } })).filter(item => {
      const qty = stockQtyMap[String(item.id)] || 0;
      return qty < Number(item.reorderLevel);
    });

    return ResponseFormatter.success(res, {
      totalItems,
      activeItems,
      totalQty,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: lowStockItems.filter(i => (stockQtyMap[String(i.id)] || 0) === 0).length,
    }, 'Dashboard stats retrieved');
  })
);

// ════════════════════════════════════════════════════════════════════════════
// SUPPLIER ROUTES
// ════════════════════════════════════════════════════════════════════════════

import { Supplier } from '@models/Supplier.model';
import { PurchaseOrder } from '@models/PurchaseOrder.model';

// ─── GET /inventory/suppliers ─────────────────────────────────────────────────
router.get(
  '/suppliers',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { search, status } = req.query as Record<string, string>;
    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or as any] = [
        { supplierName: { [Op.iLike]: `%${search}%` } },
        { contactPerson: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    const suppliers = await Supplier.findAll({ where, order: [['supplierName', 'ASC']] });
    return ResponseFormatter.success(res, suppliers, 'Suppliers retrieved');
  })
);

// ─── POST /inventory/suppliers ────────────────────────────────────────────────
router.post(
  '/suppliers',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { supplierName, contactPerson, phone, email, address, city, state, country, paymentTerms, rating, notes } = req.body;
    if (!supplierName) return ResponseFormatter.error(res, 'supplierName is required', 400);
    const last = await Supplier.findOne({ order: [['id', 'DESC']], paranoid: false });
    const code = `SUP-${String(last ? Number(last.id) + 1 : 1).padStart(5, '0')}`;
    const supplier = await Supplier.create({ supplierCode: code, supplierName, contactPerson, phone, email, address, city, state, country, paymentTerms, rating, notes, status: 'Active' } as any);
    return ResponseFormatter.success(res, supplier, 'Supplier created', 201);
  })
);

// ─── PUT /inventory/suppliers/:id ─────────────────────────────────────────────
router.put(
  '/suppliers/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return ResponseFormatter.notFound(res, 'Supplier not found');
    await supplier.update(req.body);
    return ResponseFormatter.success(res, supplier, 'Supplier updated');
  })
);

// ─── DELETE /inventory/suppliers/:id ──────────────────────────────────────────
router.delete(
  '/suppliers/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const supplier = await Supplier.findByPk(req.params.id);
    if (!supplier) return ResponseFormatter.notFound(res, 'Supplier not found');
    await supplier.destroy();
    return ResponseFormatter.success(res, null, 'Supplier deleted');
  })
);

// ════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDER ROUTES
// ════════════════════════════════════════════════════════════════════════════

// ─── GET /inventory/purchase-orders ───────────────────────────────────────────
router.get(
  '/purchase-orders',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { supplierId, status } = req.query as Record<string, string>;
    const where: Record<string, any> = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    const pos = await PurchaseOrder.findAll({
      where,
      include: [{ model: Supplier, as: 'supplier', attributes: ['id', 'supplierName'], required: false }],
      order: [['poDate', 'DESC']],
    });
    return ResponseFormatter.success(res, pos, 'Purchase orders retrieved');
  })
);

// ─── POST /inventory/purchase-orders ──────────────────────────────────────────
router.post(
  '/purchase-orders',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { supplierId, poDate, expectedDeliveryDate, subtotal, discount, tax, total, currency, notes } = req.body;
    if (!supplierId || !poDate || !expectedDeliveryDate || total === undefined) {
      return ResponseFormatter.error(res, 'supplierId, poDate, expectedDeliveryDate, total are required', 400);
    }
    const last = await PurchaseOrder.findOne({ order: [['id', 'DESC']], paranoid: false });
    const code = `PO-${String(last ? Number(last.id) + 1 : 1).padStart(6, '0')}`;
    const po = await PurchaseOrder.create({
      poCode: code, supplierId, poDate: new Date(poDate), expectedDeliveryDate: new Date(expectedDeliveryDate),
      subtotal: subtotal ?? 0, discount: discount ?? 0, tax: tax ?? 0, total, currency: currency ?? 'NGN',
      status: 'Draft', notes, createdById: user.id,
    } as any);
    return ResponseFormatter.success(res, po, 'Purchase order created', 201);
  })
);

// ─── PATCH /inventory/purchase-orders/:id/status ──────────────────────────────
router.patch(
  '/purchase-orders/:id/status',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) return ResponseFormatter.notFound(res, 'Purchase order not found');
    await po.update({ status: req.body.status });
    return ResponseFormatter.success(res, po, 'Status updated');
  })
);

// ─── GET /inventory/stock/:itemId ─────────────────────────────────────────────
router.get(
  '/stock/:itemId',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('inv.inventory.read.all', 'inv.item.read.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;

    const item = await InventoryItem.findOne({
      where: isNaN(Number(itemId)) ? { uuid: itemId } : { id: itemId },
    });

    if (!item) {
      return ResponseFormatter.notFound(res, 'Inventory item not found');
    }

    const stockRecords = await WarehouseStock.findAll({
      where: { itemId: item.id },
      include: [
        {
          model:      Warehouse,
          as:         'warehouse',
          attributes: ['id', 'warehouseCode', 'warehouseName', 'city', 'isActive'],
          required:   false,
        },
      ],
      order: [['warehouseId', 'ASC']],
    });

    // Aggregate totals
    const totals = stockRecords.reduce(
      (acc, row) => ({
        totalQuantity:   acc.totalQuantity   + Number(row.quantity),
        totalReserved:   acc.totalReserved   + Number(row.reservedQuantity),
        totalAvailable:  acc.totalAvailable  + Number(row.availableQuantity),
      }),
      { totalQuantity: 0, totalReserved: 0, totalAvailable: 0 }
    );

    return ResponseFormatter.success(
      res,
      {
        item: {
          id:           item.id,
          uuid:         item.uuid,
          itemCode:     item.itemCode,
          itemName:     item.itemName,
          unitOfMeasure: item.unitOfMeasure,
          reorderLevel: item.reorderLevel,
        },
        stock: stockRecords,
        totals,
        isBelowReorderLevel: totals.totalQuantity < item.reorderLevel,
      },
      'Stock levels retrieved'
    );
  })
);

export default router;
