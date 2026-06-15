import { Request, Response } from 'express';
import express from 'express';
import AuthMiddleware from '../middleware/AuthMiddleware';
import { Client } from '../models/Client.model';
import { MessageTemplate } from '../models/MessageTemplate.model';
import { CommunicationLog } from '../models/CommunicationLog.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { Op } from 'sequelize';
import { sendMessage } from '../services/CommunicationService';

const router = express.Router();

// ── Templates ───────────────────────────────────────────────────────────────

router.get(
  '/templates',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const templates = await MessageTemplate.findAll({ order: [['createdAt', 'DESC']] });
    ResponseFormatter.success(res, templates.map((t) => t.toJSON()));
  })
);

router.post(
  '/templates',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { name, type, subject, emailContent, smsContent, whatsappContent } = req.body;
    const userId = (req as any).user?.id || 1;
    const template = await MessageTemplate.create({
      name,
      type: type || 'Custom',
      subject,
      emailContent,
      smsContent,
      whatsappContent,
      isActive: true,
      createdByUserId: BigInt(userId),
    });
    ResponseFormatter.success(res, template.toJSON(), 'Template created', 201);
  })
);

router.patch(
  '/templates/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const tpl = await MessageTemplate.findByPk(req.params.id);
    if (!tpl) return ResponseFormatter.notFound(res, 'Template not found');
    await tpl.update(req.body);
    ResponseFormatter.success(res, tpl.toJSON(), 'Template updated');
  })
);

router.delete(
  '/templates/:id',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const tpl = await MessageTemplate.findByPk(req.params.id);
    if (!tpl) return ResponseFormatter.notFound(res, 'Template not found');
    await tpl.destroy();
    ResponseFormatter.success(res, null, 'Template deleted');
  })
);

// ── Send Message ─────────────────────────────────────────────────────────────

router.post(
  '/send',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const {
      channel,
      recipientType,
      recipientFilter,
      subject,
      message,
      selectedClientIds,
      scheduledAt,
    } = req.body;

    const userId = (req as any).user?.id || 1;

    // Resolve recipients
    const where: Record<string, unknown> = { status: 'Active' };
    if (recipientType === 'Department' && recipientFilter?.departmentId) {
      where.departmentId = BigInt(recipientFilter.departmentId);
    } else if (recipientType === 'Country' && recipientFilter?.country) {
      where.country = recipientFilter.country;
    } else if (recipientType === 'Status' && recipientFilter?.status) {
      where.status = recipientFilter.status;
    } else if (recipientType === 'Selected' && selectedClientIds?.length) {
      (where as any).id = { [Op.in]: selectedClientIds.map((id: string) => BigInt(id)) };
    }

    const clients = await Client.findAll({
      where,
      attributes: ['id', 'fullName', 'email', 'phone'],
    });

    // Create log entry
    const log = await CommunicationLog.create({
      type: 'Manual',
      channel,
      recipientType: recipientType || 'All',
      recipientFilter: recipientFilter ? JSON.stringify(recipientFilter) : undefined,
      subject,
      message,
      totalRecipients: clients.length,
      status: 'Sending',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      createdByUserId: BigInt(userId),
    });

    // Send messages (async, don't await fully for large batches)
    let successCount = 0;
    let failureCount = 0;

    for (const client of clients) {
      const result = await sendMessage(channel, client.toJSON() as any, subject, message);
      if (result) successCount++;
      else failureCount++;
    }

    await log.update({
      successCount,
      failureCount,
      status: failureCount === 0 ? 'Completed' : successCount === 0 ? 'Failed' : 'Partial',
      sentAt: new Date(),
    });

    ResponseFormatter.success(res, {
      logId: Number(log.id),
      totalRecipients: clients.length,
      successCount,
      failureCount,
    }, `Message sent to ${successCount}/${clients.length} recipients`);
  })
);

// ── Logs ─────────────────────────────────────────────────────────────────────

router.get(
  '/logs',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    const { type, channel, status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const offset = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (channel) where.channel = channel;
    if (status) where.status = status;

    const { count, rows } = await CommunicationLog.findAndCountAll({
      where,
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: { total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) },
    });
  })
);

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get(
  '/stats',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(async (_req: Request, res: Response) => {
    const [totalSent, emailSent, smsSent, whatsappSent, failed] = await Promise.all([
      CommunicationLog.count({ where: { status: { [Op.in]: ['Completed', 'Partial'] } } }),
      CommunicationLog.count({ where: { channel: 'Email' } }),
      CommunicationLog.count({ where: { channel: 'SMS' } }),
      CommunicationLog.count({ where: { channel: 'WhatsApp' } }),
      CommunicationLog.count({ where: { status: 'Failed' } }),
    ]);
    ResponseFormatter.success(res, { totalSent, emailSent, smsSent, whatsappSent, failed });
  })
);

export default router;
