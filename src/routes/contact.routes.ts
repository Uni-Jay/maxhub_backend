import { Router, Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { Contact } from '@models/Contact.model';
import { QueryTypes } from 'sequelize';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate next contactCode: CTK-000001 */
async function generateContactCode(): Promise<string> {
  const last = await Contact.findOne({ order: [['id', 'DESC']], paranoid: false });
  const nextNum = last ? Number(last.id) + 1 : 1;
  return `CTK-${String(nextNum).padStart(6, '0')}`;
}

// ─── Clients → Contacts ──────────────────────────────────────────────────────
// Every registered client (Clients page, VisaMax onboarding, …) is also a CRM
// contact. Missing ones are added automatically whenever Contacts is opened;
// details staff typed into a contact are never overwritten — only blanks are filled.
let lastSync = 0;
export async function syncContactsFromClients(force = false): Promise<number> {
  if (!force && Date.now() - lastSync < 30_000) return 0;
  lastSync = Date.now();
  const sequelize: any = (Contact as any).sequelize;
  const hasDeleted = !!(Contact as any).getAttributes().deletedAt;
  const notDeleted = hasDeleted ? 'AND ct."deletedAt" IS NULL' : '';
  const [, inserted]: any = await sequelize.query(`
    INSERT INTO contacts (uuid, "contactCode", "firstName", "lastName", email, phone, company, source, status, address, country, notes, "createdAt", "updatedAt")
    SELECT gen_random_uuid(),
           'CTK-' || COALESCE(NULLIF(c."clientId", ''), 'CL' || c.id::text),
           LEFT(COALESCE(NULLIF(split_part(TRIM(c."fullName"), ' ', 1), ''), 'Client'), 100),
           LEFT(COALESCE(NULLIF(TRIM(substr(TRIM(c."fullName"), length(split_part(TRIM(c."fullName"), ' ', 1)) + 1)), ''), '-'), 100),
           LOWER(TRIM(c.email)), LEFT(COALESCE(c.phone, ''), 20), d.name, 'Direct', 'Active', c.address, c.country,
           'Registered client ' || COALESCE(c."clientId", '#' || c.id::text),
           NOW(), NOW()
    FROM clients c
    LEFT JOIN departments d ON d.id = c."departmentId"
    WHERE c."deletedAt" IS NULL AND COALESCE(TRIM(c.email), '') <> ''
      AND NOT EXISTS (SELECT 1 FROM contacts ct WHERE LOWER(ct.email) = LOWER(TRIM(c.email)) ${notDeleted})
    ON CONFLICT DO NOTHING`, { type: QueryTypes.INSERT }).catch((e: any) => { console.error('[CRM] client→contact sync failed:', e?.message); return [null, 0]; });
  // Fill blanks on contacts that already exist for a client (never overwrite).
  await sequelize.query(`
    UPDATE contacts ct SET
      phone = CASE WHEN COALESCE(ct.phone, '') = '' THEN LEFT(COALESCE(c.phone, ''), 20) ELSE ct.phone END,
      country = COALESCE(NULLIF(ct.country, ''), c.country),
      address = COALESCE(NULLIF(ct.address, ''), c.address),
      company = COALESCE(NULLIF(ct.company, ''), d.name),
      "updatedAt" = NOW()
    FROM clients c LEFT JOIN departments d ON d.id = c."departmentId"
    WHERE c."deletedAt" IS NULL AND LOWER(ct.email) = LOWER(TRIM(c.email))
      AND ((COALESCE(ct.phone, '') = '' AND COALESCE(c.phone, '') <> '') OR (COALESCE(ct.country, '') = '' AND c.country IS NOT NULL)
        OR (COALESCE(ct.address, '') = '' AND c.address IS NOT NULL) OR (COALESCE(ct.company, '') = '' AND d.name IS NOT NULL))`).catch(() => undefined);
  return Number(inserted) || 0;
}

// ─── GET /contacts/stats/pipeline ───────────────────────────────────────────
// Must be declared before /:id so the literal "stats" segment is matched first
router.get(
  '/stats/pipeline',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'),
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const counts = await Contact.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const pipeline: Record<string, number> = {
      Active: 0,
      Inactive: 0,
      Lead: 0,
      Prospect: 0,
      Converted: 0,
      Lost: 0,
    };

    for (const row of counts as any[]) {
      pipeline[row.status] = Number(row.count);
    }

    const total = Object.values(pipeline).reduce((a, b) => a + b, 0);

    return ResponseFormatter.success(res, { pipeline, total }, 'Pipeline stats retrieved');
  })
);

// ─── GET /contacts/stats ──────────────────────────────────────────────────────
// Must be declared before /:id so the literal "stats" segment is matched first
router.get(
  '/stats',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'),
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    await syncContactsFromClients();
    const counts = await Contact.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }) as any[];

    const byStatus: Record<string, number> = {};
    for (const row of counts) byStatus[row.status] = Number(row.count);

    return ResponseFormatter.success(res, {
      total: Object.values(byStatus).reduce((a, b) => a + b, 0),
      active: byStatus.Active ?? 0,
      leads: byStatus.Lead ?? 0,
      prospects: byStatus.Prospect ?? 0,
      converted: byStatus.Converted ?? 0,
    }, 'Contact stats retrieved');
  })
);

// ─── POST /contacts/sync-clients — add registered clients now ─────────────────
router.post(
  '/sync-clients',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'),
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const added = await syncContactsFromClients(true);
    return ResponseFormatter.success(res, { added }, added ? `${added} client(s) added to contacts` : 'Contacts are up to date');
  })
);

// ─── GET /contacts ────────────────────────────────────────────────────────────
router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'),
  AuthMiddleware.pagination,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    await syncContactsFromClients();
    const { page, limit, offset } = req.pagination!;
    const { status, source, search, ownerUserId } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (status) where.status = status;
    if (source) where.source = source;
    if (ownerUserId) where.ownerUserId = ownerUserId;

    if (search) {
      where[Op.or as any] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } },
        { contactCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Contact.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return ResponseFormatter.paginated(res, rows, count, page, limit, 'Contacts retrieved');
  })
);

// ─── POST /contacts ───────────────────────────────────────────────────────────
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.create.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      firstName, lastName, email, phone, alternatePhone,
      company, position, department, accountId,
      source, leadScore, status, ownerUserId,
      address, city, state, country, postalCode,
      industry, noOfEmployees, websiteUrl,
      notes, lastContactedDate, nextFollowUpDate,
    } = req.body;

    if (!firstName || !lastName || !email || !phone) {
      return ResponseFormatter.error(res, 'firstName, lastName, email and phone are required', 400);
    }

    const existing = await Contact.findOne({ where: { email } });
    if (existing) {
      return ResponseFormatter.conflict(res, `A contact with email '${email}' already exists`);
    }

    const contactCode = await generateContactCode();

    const contact = await Contact.create({
      contactCode,
      firstName,
      lastName,
      email,
      phone,
      alternatePhone,
      company,
      position,
      department,
      accountId,
      source: source || 'Direct',
      leadScore: leadScore ?? 0,
      status: status || 'Lead',
      ownerUserId: ownerUserId || req.user!.id,
      address,
      city,
      state,
      country,
      postalCode,
      industry,
      noOfEmployees,
      websiteUrl,
      notes,
      lastContactedDate,
      nextFollowUpDate,
    });

    return ResponseFormatter.success(res, contact, 'Contact created successfully', 201);
  })
);

// ─── GET /contacts/:id ────────────────────────────────────────────────────────
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.read.all', 'crm.contact.read.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const contact = await Contact.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!contact) {
      return ResponseFormatter.notFound(res, 'Contact not found');
    }

    return ResponseFormatter.success(res, contact, 'Contact retrieved');
  })
);

// ─── PUT /contacts/:id ────────────────────────────────────────────────────────
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.update.all', 'crm.contact.update.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const contact = await Contact.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!contact) {
      return ResponseFormatter.notFound(res, 'Contact not found');
    }

    const {
      firstName, lastName, email, phone, alternatePhone,
      company, position, department, accountId,
      source, leadScore, ownerUserId,
      address, city, state, country, postalCode,
      industry, noOfEmployees, websiteUrl,
      notes, lastContactedDate, nextFollowUpDate,
    } = req.body;

    // Guard against email collision with a different contact
    if (email && email !== contact.email) {
      const dupe = await Contact.findOne({ where: { email } });
      if (dupe) {
        return ResponseFormatter.conflict(res, `Email '${email}' is already used by another contact`);
      }
    }

    await contact.update({
      firstName:        firstName        ?? contact.firstName,
      lastName:         lastName         ?? contact.lastName,
      email:            email            ?? contact.email,
      phone:            phone            ?? contact.phone,
      alternatePhone:   alternatePhone   ?? contact.alternatePhone,
      company:          company          ?? contact.company,
      position:         position         ?? contact.position,
      department:       department       ?? contact.department,
      accountId:        accountId        ?? contact.accountId,
      source:           source           ?? contact.source,
      leadScore:        leadScore        ?? contact.leadScore,
      ownerUserId:      ownerUserId      ?? contact.ownerUserId,
      address:          address          ?? contact.address,
      city:             city             ?? contact.city,
      state:            state            ?? contact.state,
      country:          country          ?? contact.country,
      postalCode:       postalCode       ?? contact.postalCode,
      industry:         industry         ?? contact.industry,
      noOfEmployees:    noOfEmployees    ?? contact.noOfEmployees,
      websiteUrl:       websiteUrl       ?? contact.websiteUrl,
      notes:            notes            ?? contact.notes,
      lastContactedDate: lastContactedDate ?? contact.lastContactedDate,
      nextFollowUpDate:  nextFollowUpDate  ?? contact.nextFollowUpDate,
    });

    return ResponseFormatter.success(res, contact, 'Contact updated successfully');
  })
);

// ─── DELETE /contacts/:id ─────────────────────────────────────────────────────
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.delete.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const contact = await Contact.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!contact) {
      return ResponseFormatter.notFound(res, 'Contact not found');
    }

    await contact.destroy(); // soft-delete (paranoid: true)

    return ResponseFormatter.success(res, null, 'Contact deleted successfully');
  })
);

// ─── PATCH /contacts/:id/status ───────────────────────────────────────────────
router.patch(
  '/:id/status',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.update.all', 'crm.contact.update.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Active', 'Inactive', 'Lead', 'Prospect', 'Converted', 'Lost'];
    if (!status || !validStatuses.includes(status)) {
      return ResponseFormatter.error(
        res,
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    const contact = await Contact.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!contact) {
      return ResponseFormatter.notFound(res, 'Contact not found');
    }

    await contact.update({ status });

    return ResponseFormatter.success(res, contact, `Contact status updated to '${status}'`);
  })
);

// ─── POST /contacts/:id/follow-up ─────────────────────────────────────────────
router.post(
  '/:id/follow-up',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.contact.update.all', 'crm.contact.update.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { nextFollowUpDate, notes } = req.body;

    if (!nextFollowUpDate) {
      return ResponseFormatter.error(res, 'nextFollowUpDate is required', 400);
    }

    const contact = await Contact.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!contact) {
      return ResponseFormatter.notFound(res, 'Contact not found');
    }

    const updatePayload: Record<string, any> = {
      nextFollowUpDate,
      lastContactedDate: new Date(),
    };

    if (notes !== undefined) {
      // Append notes rather than replacing
      updatePayload.notes = contact.notes
        ? `${contact.notes}\n\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`;
    }

    await contact.update(updatePayload);

    return ResponseFormatter.success(res, contact, 'Follow-up scheduled successfully');
  })
);

export default router;
