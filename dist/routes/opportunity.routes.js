"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("@middleware/AuthMiddleware");
const Opportunity_model_1 = require("@models/Opportunity.model");
const router = (0, express_1.Router)();
async function generateOpportunityCode() {
    const last = await Opportunity_model_1.Opportunity.findOne({ order: [['id', 'DESC']], paranoid: false });
    const nextNum = last ? Number(last.id) + 1 : 1;
    return `OPP-${String(nextNum).padStart(6, '0')}`;
}
router.get('/stats/pipeline', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (_req, res) => {
    const rows = await Opportunity_model_1.Opportunity.findAll({
        attributes: [
            'stage',
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 'totalAmount'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('expectedRevenue')), 'totalExpectedRevenue'],
        ],
        group: ['stage'],
        raw: true,
    });
    const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Closed'];
    const pipeline = {};
    for (const stage of stages) {
        pipeline[stage] = { count: 0, totalAmount: 0, totalExpectedRevenue: 0 };
    }
    for (const row of rows) {
        pipeline[row.stage] = {
            count: Number(row.count),
            totalAmount: Number(row.totalAmount) || 0,
            totalExpectedRevenue: Number(row.totalExpectedRevenue) || 0,
        };
    }
    const totals = Object.values(pipeline).reduce((acc, cur) => ({
        count: acc.count + cur.count,
        totalAmount: acc.totalAmount + cur.totalAmount,
        totalExpectedRevenue: acc.totalExpectedRevenue + cur.totalExpectedRevenue,
    }), { count: 0, totalAmount: 0, totalExpectedRevenue: 0 });
    return ResponseFormatter_1.ResponseFormatter.success(res, { pipeline, totals }, 'Pipeline stats retrieved');
}));
router.get('/stats/forecast', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const rows = await Opportunity_model_1.Opportunity.findAll({
        attributes: [
            [(0, sequelize_1.literal)('EXTRACT(YEAR FROM "close_date")'), 'year'],
            [(0, sequelize_1.literal)('EXTRACT(MONTH FROM "close_date")'), 'month'],
            [(0, sequelize_1.fn)('COUNT', (0, sequelize_1.col)('id')), 'count'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('amount')), 'totalAmount'],
            [(0, sequelize_1.fn)('SUM', (0, sequelize_1.col)('expectedRevenue')), 'totalExpectedRevenue'],
        ],
        where: {
            stage: { [sequelize_1.Op.notIn]: ['Lost', 'Closed'] },
            closeDate: {
                [sequelize_1.Op.between]: [
                    new Date(`${targetYear}-01-01`),
                    new Date(`${targetYear}-12-31`),
                ],
            },
        },
        group: [
            (0, sequelize_1.literal)('EXTRACT(YEAR FROM "close_date")'),
            (0, sequelize_1.literal)('EXTRACT(MONTH FROM "close_date")'),
        ],
        order: [[(0, sequelize_1.literal)('EXTRACT(MONTH FROM "close_date")'), 'ASC']],
        raw: true,
    });
    const forecast = [];
    for (let m = 1; m <= 12; m++) {
        const found = rows.find((r) => Number(r.month) === m);
        forecast.push({
            year: targetYear,
            month: m,
            count: found ? Number(found.count) : 0,
            totalAmount: found ? Number(found.totalAmount) || 0 : 0,
            totalExpectedRevenue: found ? Number(found.totalExpectedRevenue) || 0 : 0,
        });
    }
    const grandTotal = forecast.reduce((acc, cur) => ({
        count: acc.count + cur.count,
        totalAmount: acc.totalAmount + cur.totalAmount,
        totalExpectedRevenue: acc.totalExpectedRevenue + cur.totalExpectedRevenue,
    }), { count: 0, totalAmount: 0, totalExpectedRevenue: 0 });
    return ResponseFormatter_1.ResponseFormatter.success(res, { year: targetYear, forecast, grandTotal }, 'Forecast retrieved');
}));
router.get('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'), AuthMiddleware_1.AuthMiddleware.pagination, ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const { stage, ownerUserId, priority, type, search } = req.query;
    const where = {};
    if (stage)
        where.stage = stage;
    if (ownerUserId)
        where.ownerUserId = ownerUserId;
    if (priority)
        where.priority = priority;
    if (type)
        where.type = type;
    if (search) {
        where[sequelize_1.Op.or] = [
            { title: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { opportunityCode: { [sequelize_1.Op.iLike]: `%${search}%` } },
            { description: { [sequelize_1.Op.iLike]: `%${search}%` } },
        ];
    }
    const { count, rows } = await Opportunity_model_1.Opportunity.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });
    return ResponseFormatter_1.ResponseFormatter.paginated(res, rows, count, page, limit, 'Opportunities retrieved');
}));
router.post('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.create.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { title, description, accountId, primaryContactId, amount, currency, closeDate, stage, probability, expectedRevenue, priority, type, source, competitorInfo, nextStepDate, nextStep, ownerUserId, } = req.body;
    if (!title || primaryContactId === undefined || amount === undefined || !closeDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title, primaryContactId, amount, and closeDate are required', 400);
    }
    const opportunityCode = await generateOpportunityCode();
    const prob = probability ?? 0;
    const expRevenue = expectedRevenue ?? (Number(amount) * prob) / 100;
    const opp = await Opportunity_model_1.Opportunity.create({
        opportunityCode,
        title,
        description,
        accountId,
        primaryContactId,
        ownerUserId: ownerUserId || req.user.id,
        amount,
        currency: currency || 'USD',
        closeDate,
        stage: stage || 'Prospecting',
        probability: prob,
        expectedRevenue: expRevenue,
        priority: priority || 'Medium',
        type: type || 'New Business',
        source,
        competitorInfo,
        nextStepDate,
        nextStep,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, opp, 'Opportunity created successfully', 201);
}));
router.get('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.read.all', 'crm.opportunity.read.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const opp = await Opportunity_model_1.Opportunity.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!opp) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Opportunity not found');
    }
    return ResponseFormatter_1.ResponseFormatter.success(res, opp, 'Opportunity retrieved');
}));
router.put('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.update.all', 'crm.opportunity.update.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const opp = await Opportunity_model_1.Opportunity.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!opp) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Opportunity not found');
    }
    const { title, description, accountId, primaryContactId, amount, currency, closeDate, probability, expectedRevenue, priority, type, source, competitorInfo, nextStepDate, nextStep, lostReason, ownerUserId, } = req.body;
    const newAmount = amount !== undefined ? Number(amount) : Number(opp.amount);
    const newProbability = probability !== undefined ? Number(probability) : (opp.probability ?? 0);
    const newExpected = expectedRevenue !== undefined
        ? Number(expectedRevenue)
        : (newAmount * newProbability) / 100;
    await opp.update({
        title: title ?? opp.title,
        description: description ?? opp.description,
        accountId: accountId ?? opp.accountId,
        primaryContactId: primaryContactId ?? opp.primaryContactId,
        ownerUserId: ownerUserId ?? opp.ownerUserId,
        amount: newAmount,
        currency: currency ?? opp.currency,
        closeDate: closeDate ?? opp.closeDate,
        probability: newProbability,
        expectedRevenue: newExpected,
        priority: priority ?? opp.priority,
        type: type ?? opp.type,
        source: source ?? opp.source,
        competitorInfo: competitorInfo ?? opp.competitorInfo,
        nextStepDate: nextStepDate ?? opp.nextStepDate,
        nextStep: nextStep ?? opp.nextStep,
        lostReason: lostReason ?? opp.lostReason,
    });
    return ResponseFormatter_1.ResponseFormatter.success(res, opp, 'Opportunity updated successfully');
}));
router.delete('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.delete.all'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const opp = await Opportunity_model_1.Opportunity.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!opp) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Opportunity not found');
    }
    await opp.destroy();
    return ResponseFormatter_1.ResponseFormatter.success(res, null, 'Opportunity deleted successfully');
}));
router.patch('/:id/stage', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requirePermission('crm.opportunity.update.all', 'crm.opportunity.update.own'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stage, lostReason, probability } = req.body;
    const validStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Closed'];
    if (!stage || !validStages.includes(stage)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, `Invalid stage. Must be one of: ${validStages.join(', ')}`, 400);
    }
    if (stage === 'Lost' && !lostReason) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'lostReason is required when moving to Lost stage', 400);
    }
    const opp = await Opportunity_model_1.Opportunity.findOne({
        where: isNaN(Number(id)) ? { uuid: id } : { id },
    });
    if (!opp) {
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Opportunity not found');
    }
    const updatePayload = { stage };
    if (probability !== undefined) {
        updatePayload.probability = Number(probability);
        updatePayload.expectedRevenue = (Number(opp.amount) * Number(probability)) / 100;
    }
    if (stage === 'Won') {
        updatePayload.wonDate = new Date();
        updatePayload.probability = 100;
        updatePayload.expectedRevenue = Number(opp.amount);
    }
    if (stage === 'Lost') {
        updatePayload.lostDate = new Date();
        updatePayload.lostReason = lostReason;
        updatePayload.probability = 0;
        updatePayload.expectedRevenue = 0;
    }
    await opp.update(updatePayload);
    return ResponseFormatter_1.ResponseFormatter.success(res, opp, `Opportunity moved to stage '${stage}'`);
}));
exports.default = router;
//# sourceMappingURL=opportunity.routes.js.map