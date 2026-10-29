import { DataTypes, Model, ModelStatic, Sequelize } from 'sequelize';

/**
 * ERP v2 models. All tables are new (prefixed erp_) so they can be created
 * with CREATE TABLE IF NOT EXISTS on startup without touching any existing
 * table. Existing data (users, staff, clients, departments…) is referenced
 * by id only.
 */

const ID = () => ({ type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true });
const FK = () => ({ type: DataTypes.BIGINT, allowNull: true });
const MONEY = () => ({ type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 });
const OPTS = { timestamps: true, paranoid: false, underscored: false, freezeTableName: true };

/** Common customer-contact columns reused by several brand records. */
const CONTACT = () => ({
  clientId: FK(),
  customerName: { type: DataTypes.STRING(200), allowNull: false },
  customerEmail: { type: DataTypes.STRING(255), allowNull: true },
  customerPhone: { type: DataTypes.STRING(40), allowNull: true },
  customerWhatsapp: { type: DataTypes.STRING(40), allowNull: true },
  customerCountry: { type: DataTypes.STRING(100), allowNull: true },
});

/** Ownership / scope columns on every brand record. */
const SCOPE = () => ({
  departmentId: FK(),
  branchId: FK(),
  assignedToUserId: FK(),
  createdById: FK(),
  meta: { type: DataTypes.JSONB, allowNull: true },
});

export const ErpModels: Record<string, ModelStatic<Model>> = {};

export function defineErpModels(sequelize: Sequelize): Record<string, ModelStatic<Model>> {
  if (ErpModels.BrandProfile) return ErpModels;

  ErpModels.Setting = sequelize.define('ErpSetting', {
    key: { type: DataTypes.STRING(120), primaryKey: true },
    value: { type: DataTypes.JSONB, allowNull: true },
  }, { ...OPTS, tableName: 'erp_settings' });

  ErpModels.Migration = sequelize.define('ErpMigration', {
    name: { type: DataTypes.STRING(160), primaryKey: true },
    ranAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { ...OPTS, timestamps: false, tableName: 'erp_migrations' });

  ErpModels.BrandProfile = sequelize.define('ErpBrandProfile', {
    id: ID(),
    departmentId: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    code: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    displayName: { type: DataTypes.STRING(200), allowNull: false },
    tagline: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    website: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(40), allowNull: true },
    whatsapp: { type: DataTypes.STRING(40), allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    logoUrl: { type: DataTypes.TEXT, allowNull: true },
    primaryColor: { type: DataTypes.STRING(20), allowNull: true },
    secondaryColor: { type: DataTypes.STRING(20), allowNull: true },
    receiptPrefix: { type: DataTypes.STRING(10), allowNull: false },
    bankDetails: { type: DataTypes.TEXT, allowNull: true },
    footerNote: { type: DataTypes.TEXT, allowNull: true },
  }, { ...OPTS, tableName: 'erp_brand_profiles' });

  // ── Terms, policies, agreements ──────────────────────────────────────────
  ErpModels.DocumentTemplate = sequelize.define('ErpDocumentTemplate', {
    id: ID(),
    departmentId: FK(),
    title: { type: DataTypes.STRING(255), allowNull: false },
    category: {
      type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Terms & Conditions',
      // Terms & Conditions | Policy | Agreement | Consent Form | Contract | Refund Policy | Privacy Policy | Other
    },
    body: { type: DataTypes.TEXT, allowNull: true },
    fileUrl: { type: DataTypes.TEXT, allowNull: true },
    fileName: { type: DataTypes.STRING(255), allowNull: true },
    version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    requiresSignature: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdById: FK(),
    updatedById: FK(),
  }, { ...OPTS, tableName: 'erp_document_templates' });

  ErpModels.SignatureRequest = sequelize.define('ErpSignatureRequest', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    templateId: FK(),
    departmentId: FK(),
    clientId: FK(),
    title: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(40), allowNull: true },
    recipientName: { type: DataTypes.STRING(200), allowNull: false },
    recipientEmail: { type: DataTypes.STRING(255), allowNull: true },
    recipientPhone: { type: DataTypes.STRING(40), allowNull: true },
    channel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Email' }, // Email | WhatsApp | Both | Link
    token: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    renderedBody: { type: DataTypes.TEXT, allowNull: true },
    fileUrl: { type: DataTypes.TEXT, allowNull: true },
    contentHash: { type: DataTypes.STRING(64), allowNull: true },
    requiresSignature: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Sent' }, // Draft|Sent|Viewed|Signed|Acknowledged|Declined|Expired|Cancelled
    sentAt: { type: DataTypes.DATE, allowNull: true },
    viewedAt: { type: DataTypes.DATE, allowNull: true },
    signedAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    signerName: { type: DataTypes.STRING(200), allowNull: true },
    signatureImage: { type: DataTypes.TEXT, allowNull: true },
    signerIp: { type: DataTypes.STRING(64), allowNull: true },
    signerUserAgent: { type: DataTypes.TEXT, allowNull: true },
    declineReason: { type: DataTypes.TEXT, allowNull: true },
    relatedType: { type: DataTypes.STRING(40), allowNull: true },
    relatedId: FK(),
    sentById: FK(),
    lastReminderAt: { type: DataTypes.DATE, allowNull: true },
  }, { ...OPTS, tableName: 'erp_signature_requests' });

  // ── Timeline (notes, stage changes, messages, calls) for any record ─────
  ErpModels.Activity = sequelize.define('ErpActivity', {
    id: ID(),
    entityType: { type: DataTypes.STRING(40), allowNull: false },
    entityId: { type: DataTypes.BIGINT, allowNull: false },
    departmentId: FK(),
    kind: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Note' }, // Note|StageChange|Message|Payment|Document|Call|System
    channel: { type: DataTypes.STRING(20), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
    meta: { type: DataTypes.JSONB, allowNull: true },
    createdById: FK(),
    createdByName: { type: DataTypes.STRING(200), allowNull: true },
  }, { ...OPTS, tableName: 'erp_activities', indexes: [{ fields: ['entityType', 'entityId'] }] });

  // ── Payments & receipts (all brands) ─────────────────────────────────────
  ErpModels.Payment = sequelize.define('ErpPayment', {
    id: ID(),
    receiptNo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    customerName: { type: DataTypes.STRING(200), allowNull: false },
    relatedType: { type: DataTypes.STRING(40), allowNull: true },
    relatedId: FK(),
    relatedCode: { type: DataTypes.STRING(60), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: false },
    items: { type: DataTypes.JSONB, allowNull: true },
    amount: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    method: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Transfer' },
    reference: { type: DataTypes.STRING(120), allowNull: true },
    paidAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Completed' }, // Completed | Voided | Refunded
    voidReason: { type: DataTypes.TEXT, allowNull: true },
    receivedByName: { type: DataTypes.STRING(200), allowNull: true },
    fxRate: { type: DataTypes.DECIMAL(14, 4), allowNull: true },     // naira per 1 unit when received
    amountNgn: { type: DataTypes.DECIMAL(15, 2), allowNull: true },  // naira value when received
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_payments' });

  // ── VisaMax — travel cases (customer onboarding → travel) ───────────────
  ErpModels.TravelCase = sequelize.define('ErpTravelCase', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    passportNumber: { type: DataTypes.STRING(60), allowNull: true },
    passportExpiry: { type: DataTypes.DATEONLY, allowNull: true },
    nationality: { type: DataTypes.STRING(100), allowNull: true },
    dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
    serviceType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Visa Processing' },
    visaType: { type: DataTypes.STRING(60), allowNull: true },
    destinationCountry: { type: DataTypes.STRING(100), allowNull: true },
    travelDate: { type: DataTypes.DATEONLY, allowNull: true },
    returnDate: { type: DataTypes.DATEONLY, allowNull: true },
    travellers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    stage: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Inquiry' },
    priority: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Medium' },
    source: { type: DataTypes.STRING(60), allowNull: true },
    appointmentDate: { type: DataTypes.DATE, allowNull: true },
    biometricsDate: { type: DataTypes.DATE, allowNull: true },
    submissionDate: { type: DataTypes.DATEONLY, allowNull: true },
    decisionDate: { type: DataTypes.DATEONLY, allowNull: true },
    decision: { type: DataTypes.STRING(20), allowNull: true },
    amountQuoted: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    checklist: { type: DataTypes.JSONB, allowNull: true },
    onboardingCompleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_travel_cases' });

  ErpModels.TravelBooking = sequelize.define('ErpTravelBooking', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    caseId: FK(),
    ...CONTACT(),
    customerName: { type: DataTypes.STRING(200), allowNull: false },
    bookingType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Flight' }, // Flight|Hotel|Insurance|Tour Package|Airport Pickup|Visa Fee|Other
    provider: { type: DataTypes.STRING(150), allowNull: true },
    reference: { type: DataTypes.STRING(100), allowNull: true },
    origin: { type: DataTypes.STRING(120), allowNull: true },
    destination: { type: DataTypes.STRING(120), allowNull: true },
    departAt: { type: DataTypes.DATE, allowNull: true },
    returnAt: { type: DataTypes.DATE, allowNull: true },
    passengers: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    costPrice: MONEY(),
    sellingPrice: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Quoted' }, // Quoted|Reserved|Ticketed|Confirmed|Cancelled|Completed
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_travel_bookings' });

  // ── Kurios SAT — ICT solutions ───────────────────────────────────────────
  ErpModels.TechProject = sequelize.define('ErpTechProject', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    title: { type: DataTypes.STRING(255), allowNull: false },
    projectType: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Web Application' },
    description: { type: DataTypes.TEXT, allowNull: true },
    techStack: { type: DataTypes.STRING(255), allowNull: true },
    stage: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Lead' },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    deliveredDate: { type: DataTypes.DATEONLY, allowNull: true },
    contractValue: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    progress: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    repoUrl: { type: DataTypes.TEXT, allowNull: true },
    liveUrl: { type: DataTypes.TEXT, allowNull: true },
    stagingUrl: { type: DataTypes.TEXT, allowNull: true },
    milestones: { type: DataTypes.JSONB, allowNull: true },
    teamUserIds: { type: DataTypes.JSONB, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_tech_projects' });

  ErpModels.ServiceSubscription = sequelize.define('ErpServiceSubscription', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    serviceType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Hosting' }, // Domain|Hosting|SSL|Business Email|Maintenance|Cloud Server|Software License|SMS/API|Other
    name: { type: DataTypes.STRING(255), allowNull: false },
    provider: { type: DataTypes.STRING(150), allowNull: true },
    startDate: { type: DataTypes.DATEONLY, allowNull: true },
    renewalDate: { type: DataTypes.DATEONLY, allowNull: true },
    billingCycle: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Yearly' },
    costPrice: MONEY(),
    sellingPrice: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    autoRenew: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Active' }, // Active|Expiring|Expired|Cancelled
    lastReminderDays: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_service_subscriptions' });

  ErpModels.SupportTicket = sequelize.define('ErpSupportTicket', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    subject: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    category: { type: DataTypes.STRING(40), allowNull: true },
    priority: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Medium' },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Open' }, // Open|In Progress|Waiting on Client|Resolved|Closed
    projectId: FK(),
    slaDueAt: { type: DataTypes.DATE, allowNull: true },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    resolution: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_support_tickets' });

  // ── BeadMax — custom / bespoke orders ────────────────────────────────────
  ErpModels.CustomOrder = sequelize.define('ErpCustomOrder', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    itemType: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Bag' },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    colors: { type: DataTypes.STRING(255), allowNull: true },
    materials: { type: DataTypes.STRING(255), allowNull: true },
    size: { type: DataTypes.STRING(120), allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unitPrice: MONEY(),
    totalPrice: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    deliveryMethod: { type: DataTypes.STRING(40), allowNull: true },
    deliveryAddress: { type: DataTypes.TEXT, allowNull: true },
    stage: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Request' },
    images: { type: DataTypes.JSONB, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_custom_orders' });

  // ── Maxfood Farm — export of Nigerian foodstuff ──────────────────────────
  ErpModels.FoodProduct = sequelize.define('ErpFoodProduct', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    category: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Grains' },
    description: { type: DataTypes.TEXT, allowNull: true },
    unit: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'kg' },
    unitWeightKg: { type: DataTypes.DECIMAL(10, 3), allowNull: false, defaultValue: 1 },
    costPrice: MONEY(),
    costCurrency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    sellingPrice: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    stockQty: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    reorderLevel: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    nafdacNo: { type: DataTypes.STRING(60), allowNull: true },
    shelfLifeDays: { type: DataTypes.INTEGER, allowNull: true },
    packSize: { type: DataTypes.STRING(60), allowNull: true },         // e.g. 1 kg pouch, 25 kg bag
    originState: { type: DataTypes.STRING(80), allowNull: true },      // where it was sourced (state / farm)
    batchNo: { type: DataTypes.STRING(60), allowNull: true },
    harvestDate: { type: DataTypes.DATEONLY, allowNull: true },
    expiryDate: { type: DataTypes.DATEONLY, allowNull: true },
    storageCondition: { type: DataTypes.STRING(80), allowNull: true }, // Dry, Cool & dry, Chilled, Frozen
    warehouse: { type: DataTypes.STRING(120), allowNull: true },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_food_products' });

  ErpModels.ExportOrder = sequelize.define('ErpExportOrder', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    destinationCountry: { type: DataTypes.STRING(100), allowNull: false },
    destinationCity: { type: DataTypes.STRING(100), allowNull: true },
    deliveryAddress: { type: DataTypes.TEXT, allowNull: true },
    items: { type: DataTypes.JSONB, allowNull: true }, // [{productId,name,qty,unit,unitPrice,weightKg}]
    totalWeightKg: { type: DataTypes.DECIMAL(12, 3), allowNull: false, defaultValue: 0 },
    subtotal: MONEY(),
    shippingFee: MONEY(),
    otherCharges: MONEY(),
    total: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    shippingMethod: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Air Cargo' },
    carrier: { type: DataTypes.STRING(120), allowNull: true },
    trackingNo: { type: DataTypes.STRING(120), allowNull: true },
    airwayBill: { type: DataTypes.STRING(120), allowNull: true },
    stage: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Order Received' },
    shipDate: { type: DataTypes.DATEONLY, allowNull: true },
    expectedDelivery: { type: DataTypes.DATEONLY, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
    documents: { type: DataTypes.JSONB, allowNull: true }, // [{type,url,name}]
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_export_orders' });

  // ── BeadMax — product inventory & online shop ───────────────────────────
  ErpModels.ShopProduct = sequelize.define('ErpShopProduct', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(220), allowNull: true, unique: true },
    kind: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Finished product' }, // Finished product | Raw material
    category: { type: DataTypes.STRING(60), allowNull: false, defaultValue: 'Necklace' },
    description: { type: DataTypes.TEXT, allowNull: true },
    material: { type: DataTypes.STRING(120), allowNull: true },  // crystal, seed beads, coral, pearls…
    colour: { type: DataTypes.STRING(80), allowNull: true },
    size: { type: DataTypes.STRING(60), allowNull: true },       // length / bead size
    unit: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'piece' }, // piece, set, strand, pack, roll
    stockQty: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    reorderLevel: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    costPrice: MONEY(),
    price: MONEY(),
    compareAtPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: true }, // old price shown crossed out
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    images: { type: DataTypes.JSONB, allowNull: true }, // [url]
    madeToOrder: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    leadTimeDays: { type: DataTypes.INTEGER, allowNull: true },
    weightGrams: { type: DataTypes.INTEGER, allowNull: true },
    isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }, // show on beadmax.net
    isFeatured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    supplier: { type: DataTypes.STRING(160), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_shop_products' });

  ErpModels.ShopOrder = sequelize.define('ErpShopOrder', {
    id: ID(),
    code: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    ...CONTACT(),
    deliveryAddress: { type: DataTypes.TEXT, allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    state: { type: DataTypes.STRING(100), allowNull: true },
    deliveryMethod: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Delivery' }, // Delivery | Pick-up
    items: { type: DataTypes.JSONB, allowNull: true }, // [{productId, name, qty, price, image}]
    subtotal: MONEY(),
    deliveryFee: MONEY(),
    discount: MONEY(),
    total: MONEY(),
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    paymentMethod: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Bank transfer' },
    paymentStatus: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Unpaid' }, // Unpaid | Paid | Refunded
    stage: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'New' },
    source: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'Website' },
    trackingNo: { type: DataTypes.STRING(120), allowNull: true },
    customerNote: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ...SCOPE(),
  }, { ...OPTS, tableName: 'erp_shop_orders' });

  /** Every stock change for BeadMax and Maxfood products. */
  ErpModels.StockMovement = sequelize.define('ErpStockMovement', {
    id: ID(),
    brand: { type: DataTypes.STRING(4), allowNull: false },          // BM | MF
    productTable: { type: DataTypes.STRING(40), allowNull: false },  // erp_shop_products | erp_food_products
    productId: { type: DataTypes.BIGINT, allowNull: false },
    productName: { type: DataTypes.STRING(200), allowNull: true },
    change: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    balanceAfter: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    reason: { type: DataTypes.STRING(60), allowNull: false },        // Restock | Sale | Order | Damaged | Count correction | Returned
    reference: { type: DataTypes.STRING(120), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    createdById: FK(),
    createdByName: { type: DataTypes.STRING(200), allowNull: true },
  }, { ...OPTS, tableName: 'erp_stock_movements', indexes: [{ fields: ['productTable', 'productId'] }] });

  /** Pay is set per staff member (MaxHub does not use salary structures). */
  ErpModels.StaffPay = sequelize.define('ErpStaffPay', {
    staffId: { type: DataTypes.BIGINT, primaryKey: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    basicSalary: MONEY(),
    allowances: { type: DataTypes.JSONB, allowNull: true }, // [{name, amount}]
    deductions: { type: DataTypes.JSONB, allowNull: true }, // [{name, amount}]
    paymentMethod: { type: DataTypes.STRING(40), allowNull: true },
    effectiveFrom: { type: DataTypes.DATEONLY, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    updatedById: FK(),
  }, { ...OPTS, tableName: 'erp_staff_pay' });

  /** What a processed salary was made of — so a payslip shows each line. */
  ErpModels.SalaryBreakdown = sequelize.define('ErpSalaryBreakdown', {
    salaryId: { type: DataTypes.BIGINT, primaryKey: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'NGN' },
    earnings: { type: DataTypes.JSONB, allowNull: true },   // [{name, amount}]
    deductions: { type: DataTypes.JSONB, allowNull: true }, // [{name, amount}]
  }, { ...OPTS, tableName: 'erp_salary_breakdowns' });

  return ErpModels;
}
