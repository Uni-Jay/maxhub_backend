import { Router, Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { Opportunity } from '@models/Opportunity.model';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function generateOpportunityCode(): Promise<string> {
  const last = await Opportunity.findOne({ order: [['id', 'DESC']], paranoid: false });
  const nextNum = last ? Number(last.id) + 1 : 1;
  return `OPP-${String(nextNum).padStart(6, '0')}`;
}

// ─── GET /opportunities/stats/pipeline ───────────────────────────────────────
// Must precede /:id so the literal "stats" segment is matched first
router.get(
  '/stats/pipeline',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'),
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const rows = await Opportunity.findAll({
      attributes: [
        'stage',
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'totalAmount'],
        [fn('SUM', col('expectedRevenue')), 'totalExpectedRevenue'],
      ],
      group: ['stage'],
      raw: true,
    });

    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Closed'];
    const pipeline: Record<string, { count: number; totalAmount: number; totalExpectedRevenue: number }> = {};

    for (const stage of stages) {
      pipeline[stage] = { count: 0, totalAmount: 0, totalExpectedRevenue: 0 };
    }

    for (const row of rows as any[]) {
      pipeline[row.stage] = {
        count: Number(row.count),
        totalAmount: Number(row.totalAmount) || 0,
        totalExpectedRevenue: Number(row.totalExpectedRevenue) || 0,
      };
    }

    const totals = Object.values(pipeline).reduce(
      (acc, cur) => ({
        count: acc.count + cur.count,
        totalAmount: acc.totalAmount + cur.totalAmount,
        totalExpectedRevenue: acc.totalExpectedRevenue + cur.totalExpectedRevenue,
      }),
      { count: 0, totalAmount: 0, totalExpectedRevenue: 0 }
    );

    return ResponseFormatter.success(res, { pipeline, totals }, 'Pipeline stats retrieved');
  })
);

// ─── GET /opportunities/stats/forecast ───────────────────────────────────────
router.get(
  '/stats/forecast',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.query as Record<string, string>;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const rows = await Opportunity.findAll({
      attributes: [
        [fn('YEAR', col('closeDate')), 'year'],
        [fn('MONTH', col('closeDate')), 'month'],
        [fn('COUNT', col('id')), 'count'],
        [fn('SUM', col('amount')), 'totalAmount'],
        [fn('SUM', col('expectedRevenue')), 'totalExpectedRevenue'],
      ],
      where: {
        stage: { [Op.notIn]: ['Lost', 'Closed'] },
        closeDate: {
          [Op.between]: [
            new Date(`${targetYear}-01-01`),
            new Date(`${targetYear}-12-31`),
          ],
        },
      },
      group: [
        literal('YEAR(closeDate)'),
        literal('MONTH(closeDate)'),
      ] as any,
      order: [[literal('MONTH(closeDate)'), 'ASC']] as any,
      raw: true,
    });

    // Ensure all 12 months are represented
    const forecast: Array<{
      year: number;
      month: number;
      count: number;
      totalAmount: number;
      totalExpectedRevenue: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      const found = (rows as any[]).find((r) => Number(r.month) === m);
      forecast.push({
        year: targetYear,
        month: m,
        count: found ? Number(found.count) : 0,
        totalAmount: found ? Number(found.totalAmount) || 0 : 0,
        totalExpectedRevenue: found ? Number(found.totalExpectedRevenue) || 0 : 0,
      });
    }

    const grandTotal = forecast.reduce(
      (acc, cur) => ({
        count: acc.count + cur.count,
        totalAmount: acc.totalAmount + cur.totalAmount,
        totalExpectedRevenue: acc.totalExpectedRevenue + cur.totalExpectedRevenue,
      }),
      { count: 0, totalAmount: 0, totalExpectedRevenue: 0 }
    );

    return ResponseFormatter.success(res, { year: targetYear, forecast, grandTotal }, 'Forecast retrieved');
  })
);

// ─── GET /opportunities ───────────────────────────────────────────────────────
router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'),
  AuthMiddleware.pagination,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, offset } = req.pagination!;
    const { stage, ownerUserId, priority, type, search } = req.query as Record<string, string>;

    const where: Record<string, any> = {};

    if (stage)       where.stage       = stage;
    if (ownerUserId) where.ownerUserId = ownerUserId;
    if (priority)    where.priority    = priority;
    if (type)        where.type        = type;

    if (search) {
      where[Op.or as any] = [
        { title:           { [Op.like]: `%${search}%` } },
        { opportunityCode: { [Op.like]: `%${search}%` } },
        { description:     { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Opportunity.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    return ResponseFormatter.paginated(res, rows, count, page, limit, 'Opportunities retrieved');
  })
);

// ─── POST /opportunities ──────────────────────────────────────────────────────
router.post(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.create.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      title, description, accountId, primaryContactId,
      amount, currency, closeDate, stage, probability,
      expectedRevenue, priority, type, source,
      competitorInfo, nextStepDate, nextStep,
      ownerUserId,
    } = req.body;

    if (!title || primaryContactId === undefined || amount === undefined || !closeDate) {
      return ResponseFormatter.error(
        res,
        'title, primaryContactId, amount, and closeDate are required',
        400
      );
    }

    const opportunityCode = await generateOpportunityCode();
    const prob            = probability ?? 0;
    const expRevenue      = expectedRevenue ?? (Number(amount) * prob) / 100;

    const opp = await Opportunity.create({
      opportunityCode,
      title,
      description,
      accountId,
      primaryContactId,
      ownerUserId: ownerUserId || req.user!.id,
      amount,
      currency: currency || 'USD',
      closeDate,
      stage:           stage    || 'Prospecting',
      probability:     prob,
      expectedRevenue: expRevenue,
      priority:        priority || 'Medium',
      type:            type     || 'New Business',
      source,
      competitorInfo,
      nextStepDate,
      nextStep,
    });

    return ResponseFormatter.success(res, opp, 'Opportunity created successfully', 201);
  })
);

// ─── GET /opportunities/:id ───────────────────────────────────────────────────
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const opp = await Opportunity.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!opp) {
      return ResponseFormatter.notFound(res, 'Opportunity not found');
    }

    return ResponseFormatter.success(res, opp, 'Opportunity retrieved');
  })
);

// ─── PUT /opportunities/:id ───────────────────────────────────────────────────
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.update.all', 'crm.opportunity.update.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const opp = await Opportunity.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!opp) {
      return ResponseFormatter.notFound(res, 'Opportunity not found');
    }

    const {
      title, description, accountId, primaryContactId,
      amount, currency, closeDate, probability,
      expectedRevenue, priority, type, source,
      competitorInfo, nextStepDate, nextStep,
      lostReason, ownerUserId,
    } = req.body;

    const newAmount      = amount      !== undefined ? Number(amount)      : Number(opp.amount);
    const newProbability = probability !== undefined ? Number(probability) : (opp.probability ?? 0);
    const newExpected    = expectedRevenue !== undefined
      ? Number(expectedRevenue)
      : (newAmount * newProbability) / 100;

    await opp.update({
      title:            title            ?? opp.title,
      description:      description      ?? opp.description,
      accountId:        accountId        ?? opp.accountId,
      primaryContactId: primaryContactId ?? opp.primaryContactId,
      ownerUserId:      ownerUserId      ?? opp.ownerUserId,
      amount:           newAmount,
      currency:         currency         ?? opp.currency,
      closeDate:        closeDate        ?? opp.closeDate,
      probability:      newProbability,
      expectedRevenue:  newExpected,
      priority:         priority         ?? opp.priority,
      type:             type             ?? opp.type,
      source:           source           ?? opp.source,
      competitorInfo:   competitorInfo   ?? opp.competitorInfo,
      nextStepDate:     nextStepDate     ?? opp.nextStepDate,
      nextStep:         nextStep         ?? opp.nextStep,
      lostReason:       lostReason       ?? opp.lostReason,
    });

    return ResponseFormatter.success(res, opp, 'Opportunity updated successfully');
  })
);

// ─── DELETE /opportunities/:id ────────────────────────────────────────────────
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.delete.all'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const opp = await Opportunity.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!opp) {
      return ResponseFormatter.notFound(res, 'Opportunity not found');
    }

    await opp.destroy();

    return ResponseFormatter.success(res, null, 'Opportunity deleted successfully');
  })
);

// ─── PATCH /opportunities/:id/stage ──────────────────────────────────────────
router.patch(
  '/:id/stage',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requirePermission('crm.opportunity.update.all', 'crm.opportunity.update.own'),
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { stage, lostReason, probability } = req.body;

    const validStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Closed'];

    if (!stage || !validStages.includes(stage)) {
      return ResponseFormatter.error(
        res,
        `Invalid stage. Must be one of: ${validStages.join(', ')}`,
        400
      );
    }

    if (stage === 'Lost' && !lostReason) {
      return ResponseFormatter.error(res, 'lostReason is required when moving to Lost stage', 400);
    }

    const opp = await Opportunity.findOne({
      where: isNaN(Number(id)) ? { uuid: id } : { id },
    });

    if (!opp) {
      return ResponseFormatter.notFound(res, 'Opportunity not found');
    }

    const updatePayload: Record<string, any> = { stage };

    if (probability !== undefined) {
      updatePayload.probability     = Number(probability);
      updatePayload.expectedRevenue = (Number(opp.amount) * Number(probability)) / 100;
    }

    if (stage === 'Won') {
      updatePayload.wonDate         = new Date();
      updatePayload.probability     = 100;
      updatePayload.expectedRevenue = Number(opp.amount);
    }

    if (stage === 'Lost') {
      updatePayload.lostDate        = new Date();
      updatePayload.lostReason      = lostReason;
      updatePayload.probability     = 0;
      updatePayload.expectedRevenue = 0;
    }

    await opp.update(updatePayload);

    return ResponseFormatter.success(res, opp, `Opportunity moved to stage '${stage}'`);
  })
);

export default router;
