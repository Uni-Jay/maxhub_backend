"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const InventoryItem_model_1 = require("@models/InventoryItem.model");
const InventoryCategory_model_1 = require("@models/InventoryCategory.model");
const OrderTracking_model_1 = require("@models/OrderTracking.model");
const Customer_model_1 = require("@models/Customer.model");
const WarehouseStock_model_1 = require("@models/WarehouseStock.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = __importDefault(require("@middleware/AuthMiddleware"));
const PermissionCodes_1 = require("@config/PermissionCodes");
const router = (0, express_1.Router)();
function deliveryStage(status) {
    const map = { New: 0, Confirmed: 0, Processing: 1, Shipped: 2, Delivered: 3, Cancelled: 0, Refunded: 0 };
    return map[status] ?? 0;
}
function toFrontendOrder(o) {
    const payStatusMap = { Paid: 'Paid', Pending: 'Pending', Failed: 'Overdue', Refunded: 'Overdue' };
    const delStatusMap = { New: 'Pending', Confirmed: 'Processing', Processing: 'Processing', Shipped: 'Shipped', Delivered: 'Delivered', Cancelled: 'Cancelled', Refunded: 'Cancelled' };
    const customer = o.customer;
    const customerName = customer ? `${customer.firstName} ${customer.lastName}${customer.country && customer.country !== 'Nigeria' ? ` (${customer.country})` : ''}` : 'Unknown';
    return {
        id: Number(o.id),
        orderNo: o.orderNumber,
        customer: customerName,
        items: o.notes ? o.notes.split('|').map((s) => s.trim()).filter(Boolean) : [],
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
router.get('/products', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_PRODUCT_READ_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { category, status, search, limit = 100, page = 1 } = req.query;
    const where = {};
    if (status)
        where.status = status;
    if (search)
        where.itemName = { [sequelize_1.Op.iLike]: `%${search}%` };
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await InventoryItem_model_1.InventoryItem.findAndCountAll({
        where,
        include: [{ model: InventoryCategory_model_1.InventoryCategory, as: 'category', attributes: ['id', 'categoryName'] }],
        order: [['itemName', 'ASC']],
        limit: Number(limit),
        offset,
    });
    const itemIds = rows.map(r => r.id);
    const stocks = itemIds.length > 0 ? await WarehouseStock_model_1.WarehouseStock.findAll({
        where: { itemId: { [sequelize_1.Op.in]: itemIds } },
        attributes: ['itemId', [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('quantityOnHand')), 'totalQty']],
        group: ['itemId'],
    }) : [];
    const stockMap = {};
    stocks.forEach((s) => { stockMap[String(s.itemId)] = Number(s.dataValues?.totalQty ?? 0); });
    const products = rows.map(item => {
        const qty = stockMap[String(item.id)] ?? 0;
        let stockStatus = 'In Stock';
        if (qty === 0)
            stockStatus = 'Out of Stock';
        else if (qty < item.reorderLevel)
            stockStatus = 'Low Stock';
        return {
            id: Number(item.id),
            name: item.itemName,
            category: item.category?.categoryName ?? 'Uncategorized',
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
    ResponseFormatter_1.ResponseFormatter.paginated(res, products, count, Number(page), Number(limit));
}));
router.post('/products', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_PRODUCT_CREATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { name, categoryId, sku, price, stock, description } = req.body;
    if (!name || !categoryId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'name and categoryId are required', 400);
    const count = await InventoryItem_model_1.InventoryItem.count();
    const itemCode = `BM-${String(count + 1).padStart(4, '0')}`;
    const item = await InventoryItem_model_1.InventoryItem.create({
        itemCode, itemName: name, categoryId: BigInt(categoryId),
        sku: sku || null, unitCost: Number(price) || 0, unitOfMeasure: 'pcs',
        reorderLevel: 10, reorderQuantity: 50, description: description || null,
        isSerializable: false, isBatchable: false, status: 'Active',
    });
    ResponseFormatter_1.ResponseFormatter.success(res, { id: Number(item.id), name: item.itemName }, 'Product created', 201);
}));
router.delete('/products/:id', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_PRODUCT_DELETE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const item = await InventoryItem_model_1.InventoryItem.findByPk(req.params.id);
    if (!item)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Product not found');
    await item.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Product deleted');
}));
router.get('/orders', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_ORDER_READ_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { status, limit = 100, page = 1 } = req.query;
    const where = {};
    if (status) {
        const revMap = {
            Pending: ['New'], Processing: ['Confirmed', 'Processing'], Shipped: ['Shipped'],
            Delivered: ['Delivered'], Cancelled: ['Cancelled', 'Refunded'],
        };
        if (revMap[status])
            where.orderStatus = { [sequelize_1.Op.in]: revMap[status] };
    }
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await OrderTracking_model_1.OrderTracking.findAndCountAll({
        where,
        include: [{ model: Customer_model_1.Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'country'], required: false }],
        order: [['orderDate', 'DESC']],
        limit: Number(limit),
        offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.map(toFrontendOrder), count, Number(page), Number(limit));
}));
router.post('/orders', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_ORDER_CREATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { customerId, total, items, address, notes, paymentStatus } = req.body;
    if (!customerId || !total)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'customerId and total are required', 400);
    const count = await OrderTracking_model_1.OrderTracking.count();
    const orderNumber = `BMO-${String(count + 1).padStart(3, '0')}`;
    const order = await OrderTracking_model_1.OrderTracking.create({
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
    });
    ResponseFormatter_1.ResponseFormatter.success(res, toFrontendOrder(order), 'Order created', 201);
}));
router.patch('/orders/:id/status', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_ORDER_UPDATE_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { deliveryStatus, paymentStatus } = req.body;
    const order = await OrderTracking_model_1.OrderTracking.findByPk(req.params.id);
    if (!order)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Order not found');
    const statusRevMap = { Pending: 'New', Processing: 'Processing', Shipped: 'Shipped', Delivered: 'Delivered', Cancelled: 'Cancelled' };
    const updates = {};
    if (deliveryStatus)
        updates.orderStatus = statusRevMap[deliveryStatus] ?? deliveryStatus;
    if (paymentStatus)
        updates.paymentStatus = paymentStatus === 'Paid' ? 'Paid' : paymentStatus === 'Overdue' ? 'Failed' : 'Pending';
    await order.update(updates);
    ResponseFormatter_1.ResponseFormatter.success(res, toFrontendOrder(order), 'Order updated');
}));
router.get('/deliveries', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_ORDER_READ_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const orders = await OrderTracking_model_1.OrderTracking.findAll({
        where: { orderStatus: { [sequelize_1.Op.in]: ['Confirmed', 'Processing', 'Shipped'] } },
        include: [{ model: Customer_model_1.Customer, as: 'customer', attributes: ['id', 'firstName', 'lastName', 'country', 'address', 'city', 'state'], required: false }],
        order: [['orderDate', 'DESC']],
    });
    const deliveries = orders.map(o => {
        const customer = o.customer;
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
    ResponseFormatter_1.ResponseFormatter.success(res, deliveries);
}));
router.get('/analytics', AuthMiddleware_1.default.requirePermission(PermissionCodes_1.PermissionCode.BM_ANALYTICS_READ_ALL), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const monthlyRaw = await OrderTracking_model_1.OrderTracking.findAll({
        where: { paymentStatus: 'Paid', orderDate: { [sequelize_1.Op.gte]: startOfYear } },
        attributes: [
            [(0, sequelize_1.literal)('EXTRACT(MONTH FROM "orderDate")'), 'month'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('finalAmount')), 'revenue'],
        ],
        group: [(0, sequelize_1.literal)('EXTRACT(MONTH FROM "orderDate")')],
        raw: true,
    });
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = new Array(12).fill(0);
    monthlyRaw.forEach((r) => { revenueByMonth[Number(r.month) - 1] = Number(r.revenue ?? 0); });
    const revenueData = MONTHS.map((m, i) => ({ month: m, revenue: revenueByMonth[i] }));
    const mtdStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const [mtdRevenue, mtdOrders, totalOrders, totalRevenue] = await Promise.all([
        OrderTracking_model_1.OrderTracking.sum('finalAmount', { where: { paymentStatus: 'Paid', orderDate: { [sequelize_1.Op.gte]: mtdStart } } }),
        OrderTracking_model_1.OrderTracking.count({ where: { orderDate: { [sequelize_1.Op.gte]: mtdStart } } }),
        OrderTracking_model_1.OrderTracking.count(),
        OrderTracking_model_1.OrderTracking.sum('finalAmount', { where: { paymentStatus: 'Paid' } }),
    ]);
    const categories = await InventoryCategory_model_1.InventoryCategory.findAll({ attributes: ['id', 'categoryName'] });
    const catSales = categories.map((c) => ({ name: c.categoryName, value: 0 }));
    ResponseFormatter_1.ResponseFormatter.success(res, {
        revenueData,
        mtdRevenue: Number(mtdRevenue ?? 0),
        mtdOrders: Number(mtdOrders ?? 0),
        totalOrders: Number(totalOrders ?? 0),
        totalRevenue: Number(totalRevenue ?? 0),
        avgOrder: totalOrders ? Math.round(Number(totalRevenue ?? 0) / Number(totalOrders)) : 0,
        categorySales: catSales,
    });
}));
exports.default = router;
//# sourceMappingURL=beadmax.routes.js.map