// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { InventoryItem } from '@models/InventoryItem.model';
import { InventoryCategory } from '@models/InventoryCategory.model';
import { OrderTracking } from '@models/OrderTracking.model';
import { Customer } from '@models/Customer.model';
import { WarehouseStock } from '@models/WarehouseStock.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';
import sequelize from '@config/Database';

const router = Router();

function deliveryStage(status: string): number {
  const map: Record<string, number> = { New: 0, Confirmed: 0, Processing: 1, Shipped: 2, Delivered: 3, Cancelled: 0, Refunded: 0 };
  return map[status] ?? 0;
}

function toFrontendOrder(o: any): object {
  const payStatusMap: Record<string, string> = { Paid: 'Paid', Pending: 'Pending', Failed: 'Overdue', Refunded: 'Overdue' };
  const delStatusMap: Record<string, string> = { New: 'Pending', Confirmed: 'Processing', Processing: 'Processing', Shipped: 'Shipped', Delivered: 'Delivered', Cancelled: 'Cancelled', Refunded: 'Cancelled' };
  const customer = o.customer;
  const customerName = customer ? `${customer.firstName} ${customer.lastName}${customer.country && customer.country !== 'Nigeria' ? ` (${customer.country})` : ''}` : 'Unknown';
  return {
    id: Number(o.id),
    orderNo: o.orderNumber,
    customer: customerName,
    items: o.notes ? o.notes.split('|').map((s: string) => s.trim()).filter(Boolean) : [],
    total: Number(o.finalAmount),
    paymentStatus: payStatusMap[o.paymentStatus] ?? 'Pending',
    deliveryStatus: delStatusMap[o.orderStatus] ?? 'Pending',
    date: o.orderDate?.toISOString?.()?.slice(0, 10) ?? '',
    address: o.shippingAddress ?? '',
    trackingNo: o.shippingTrackingNumber ?? '',
    stage: deliveryStage(o.orderStatus),
    international: customer?.country && customer.country !== 'Nigeria',
  };
}

// GET /api/beadmax/products — inventory items as products
router.get('/products', AuthMiddleware.requirePermission(PermissionCode.BM_PRODUCT_READ_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { category, status, search, limit = 100, page = 1 } = req.query;
  const where: any = {};
  if (status) where.status = status;
  if (search) where.itemName = { [Op.iLike]: `%${search}%` };

  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await InventoryItem.findAndCountAll({
    where,
    include: [{ model: InventoryCategory, as: 'category', attributes: ['id', 'categoryName'] }],
    order: [['itemName', 'ASC']],
    limit: Number(limit),
    offset,
  });

  // Attach stock qty from WarehouseStock
  const itemIds = rows.map(r => r.id);
  const stocks = itemIds.length > 0 ? await WarehouseStock.findAll({
    where: { itemId: { [Op.in]: itemIds } },
    attributes: ['itemId', [fn('SUM', col('quantityOnHand')), 'totalQty']],
    group: ['itemId'],
  }) : [];
  const stockMap: Record<string, number> = {};
  stocks.forEach((s: any) => { stockMap[String(s.itemId)] = Number(s.dataValues?.totalQty ?? 0); });

  const products = rows.map(item => {
    const qty = stockMap[String(item.id)] ?? 0;
    let stockStatus = 'In Stock';
    if (qty === 0) stockStatus = 'Out of Stock';
    else if (qty < item.reorderLevel) stockStatus = 'Low Stock';
    return {
      id: Number(item.id),
      name: item.itemName,
      category: (item as any).category?.categoryName ?? 'Uncategorized',
      categoryId: Number(item.categoryId),
      sku: item.sku,
      price: Number(item.unitCost),
      stock: qty,
      description: item.description ?? '',
      status: stockStatus,
      sold: 0,
      rating: 5.0,
    };
  });

  ResponseFormatter.success(res, { data: products, pagination: { total: count, page: Number(page), limit: Number(limit) } });
}));

// POST /api/beadmax/products — create inventory item
router.post('/products', AuthMiddleware.requirePermission(PermissionCode.BM_PRODUCT_CREATE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name, categoryId, sku, price, stock, description } = req.body;
  if (!name || !categoryId) return ResponseFormatter.error(res, 'name and categoryId are required', 400);

  const count = await InventoryItem.count();
  const itemCode = `BM-${String(count + 1).padStart(4, '0')}`;

  const item = await InventoryItem.create({
    itemCode, itemName: name, categoryId: BigInt(categoryId),
    sku: sku || null, unitCost: Number(price) || 0, unitOfMeasure: 'pcs',
    reorderLevel: 10, reorderQuantity: 50, description: description || null,
    isSerializable: false, isBatchable: false, status: 'Active',
  } as any);

  ResponseFormatter.success(res, { id: Number(item.id), name: item.itemName }, 'Product created', 201);
}));

// DELETE /api/beadmax/products/:id
router.delete('/products/:id', AuthMiddleware.requirePermission(PermissionCode.BM_PRODUCT_DELETE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const item = await InventoryItem.findByPk(req.params.id);
  if (!item) return ResponseFormatter.notFound(res, 'Product not found');
  await item.destroy();
  ResponseFormatter.success(res, null, 'Product deleted');
}));

// GET /api/beadmax/orders — order tracking as sales orders
router.get('/orders', AuthMiddleware.requirePermission(PermissionCode.BM_ORDER_READ_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status, limit = 100, page = 1 } = req.query;
  const where: any = {};
  if (status) {
    const revMap: Record<string, string[]> = {
      Pending: ['New'], Processing: ['Confirmed', 'Processing'], Shipped: ['Shipped'],
      Delivered: ['Delivered'], Cancelled: ['Cancelled', 'Refunded'],
    };
    if (revMap[status as string]) where.orderStatus = { [Op.in]: revMap[status as string] };
  }
  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await OrderTracking.findAndCountAll({
    where,
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'country'], required: false }],
    order: [['orderDate', 'DESC']],
    limit: Number(limit),
    offset,
  });
  ResponseFormatter.success(res, { data: rows.map(toFrontendOrder), pagination: { total: count, page: Number(page), limit: Number(limit) } });
}));

// POST /api/beadmax/orders — create new order
router.post('/orders', AuthMiddleware.requirePermission(PermissionCode.BM_ORDER_CREATE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { customerId, total, items, address, notes, paymentStatus } = req.body;
  if (!customerId || !total) return ResponseFormatter.error(res, 'customerId and total are required', 400);

  const count = await OrderTracking.count();
  const orderNumber = `BMO-${String(count + 1).padStart(3, '0')}`;

  const order = await OrderTracking.create({
    organizationId: BigInt(1),
    customerId: BigInt(customerId),
    orderDate: new Date(),
    orderNumber,
    totalAmount: Number(total),
    taxAmount: 0,
    finalAmount: Number(total),
    orderStatus: 'New',
    paymentStatus: paymentStatus === 'Paid' ? 'Paid' : 'Pending',
    shippingAddress: address || '',
    notes: Array.isArray(items) ? items.join(' | ') : (notes || ''),
  } as any);

  ResponseFormatter.success(res, toFrontendOrder(order), 'Order created', 201);
}));

// PATCH /api/beadmax/orders/:id/status
router.patch('/orders/:id/status', AuthMiddleware.requirePermission(PermissionCode.BM_ORDER_UPDATE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { deliveryStatus, paymentStatus } = req.body;
  const order = await OrderTracking.findByPk(req.params.id);
  if (!order) return ResponseFormatter.notFound(res, 'Order not found');

  const statusRevMap: Record<string, string> = { Pending: 'New', Processing: 'Processing', Shipped: 'Shipped', Delivered: 'Delivered', Cancelled: 'Cancelled' };
  const updates: any = {};
  if (deliveryStatus) updates.orderStatus = statusRevMap[deliveryStatus] ?? deliveryStatus;
  if (paymentStatus) updates.paymentStatus = paymentStatus === 'Paid' ? 'Paid' : paymentStatus === 'Overdue' ? 'Failed' : 'Pending';

  await order.update(updates);
  ResponseFormatter.success(res, toFrontendOrder(order), 'Order updated');
}));

// GET /api/beadmax/deliveries — active shipments
router.get('/deliveries', AuthMiddleware.requirePermission(PermissionCode.BM_ORDER_READ_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const orders = await OrderTracking.findAll({
    where: { orderStatus: { [Op.in]: ['Confirmed', 'Processing', 'Shipped'] } },
    include: [{ model: Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'country', 'address', 'city', 'state'], required: false }],
    order: [['orderDate', 'DESC']],
  });

  const deliveries = orders.map(o => {
    const customer = (o as any).customer;
    const addr = customer ? [customer.address, customer.city, customer.state, customer.country].filter(Boolean).join(', ') : o.shippingAddress ?? '';
    return {
      id: Number(o.id),
      orderNo: o.orderNumber,
      customer: customer ? `${customer.firstName} ${customer.lastName}` : 'Unknown',
      address: addr,
      courier: 'GIG Logistics',
      trackingNo: o.shippingTrackingNumber ?? `TRK-${o.orderNumber}`,
      stage: deliveryStage(o.orderStatus),
      international: customer?.country && customer.country !== 'Nigeria',
    };
  });

  ResponseFormatter.success(res, deliveries);
}));

// GET /api/beadmax/analytics — revenue + category breakdown
router.get('/analytics', AuthMiddleware.requirePermission(PermissionCode.BM_ANALYTICS_READ_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Monthly revenue for the year
  const monthlyRaw = await OrderTracking.findAll({
    where: { paymentStatus: 'Paid', orderDate: { [Op.gte]: startOfYear } },
    attributes: [
      [literal('EXTRACT(MONTH FROM "orderDate")'), 'month'],
      [fn('SUM', col('finalAmount')), 'revenue'],
    ],
    group: [literal('EXTRACT(MONTH FROM "orderDate")')],
    raw: true,
  });

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const revenueByMonth = new Array(12).fill(0);
  monthlyRaw.forEach((r: any) => { revenueByMonth[Number(r.month) - 1] = Number(r.revenue ?? 0); });
  const revenueData = MONTHS.map((m, i) => ({ month: m, revenue: revenueByMonth[i] }));

  // MTD stats
  const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [mtdRevenue, mtdOrders, totalOrders, totalRevenue] = await Promise.all([
    OrderTracking.sum('finalAmount', { where: { paymentStatus: 'Paid', orderDate: { [Op.gte]: mtdStart } } }),
    OrderTracking.count({ where: { orderDate: { [Op.gte]: mtdStart } } }),
    OrderTracking.count(),
    OrderTracking.sum('finalAmount', { where: { paymentStatus: 'Paid' } }),
  ]);

  // Category sales breakdown from inventory
  const categories = await InventoryCategory.findAll({ attributes: ['id', 'categoryName'] });
  const catSales = categories.map((c: any) => ({ name: c.categoryName, value: 0 }));

  ResponseFormatter.success(res, {
    revenueData,
    mtdRevenue: Number(mtdRevenue ?? 0),
    mtdOrders: Number(mtdOrders ?? 0),
    totalOrders: Number(totalOrders ?? 0),
    totalRevenue: Number(totalRevenue ?? 0),
    avgOrder: totalOrders ? Math.round(Number(totalRevenue ?? 0) / Number(totalOrders)) : 0,
    categorySales: catSales,
  });
}));

export default router;
