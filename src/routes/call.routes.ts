import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Call } from '@models/Call.model';
import { User } from '@models/User.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = Router();

// POST /api/calls — initiate a 1-to-1 call
router.post('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const caller = (req as any).user;
  const { calleeUserId, callType, conversationId } = req.body;
  if (!calleeUserId) return ResponseFormatter.error(res, 'calleeUserId is required', 400);

  // Auto-end any existing ringing calls from this caller
  await Call.update(
    { status: 'Missed' },
    { where: { callerUserId: caller.id, status: 'Ringing' } }
  );

  const roomName = `MaxHub-call-${uuidv4().split('-')[0]}`;
  const call = await Call.create({
    uuid: uuidv4(),
    callerUserId: caller.id,
    calleeUserId,
    callType: callType || 'Video',
    status: 'Ringing',
    roomName,
    conversationId: conversationId || null,
  } as any);

  const callWithUsers = await Call.findByPk((call as any).id, {
    include: [
      { model: User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      { model: User, as: 'callee', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
    ],
  });

  ResponseFormatter.success(res, callWithUsers, 'Call initiated', 201);
}));

// GET /api/calls/incoming — for callee to poll
router.get('/incoming', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const calls = await Call.findAll({
    where: { calleeUserId: user.id, status: 'Ringing' },
    include: [{ model: User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
    order: [['createdAt', 'DESC']],
    limit: 5,
  });
  ResponseFormatter.success(res, calls);
}));

// GET /api/calls/history — paginated call history for current user
router.get('/history', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { count, rows } = await Call.findAndCountAll({
    where: {
      [Op.or]: [{ callerUserId: user.id }, { calleeUserId: user.id }],
    },
    include: [
      { model: User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      { model: User, as: 'callee', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit), offset,
  });

  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// PATCH /api/calls/:id/answer
router.patch('/:id/answer', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const call = await Call.findOne({
    where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
  });
  if (!call) return ResponseFormatter.error(res, 'Call not found', 404);
  await call.update({ status: 'Active', startedAt: new Date() } as any);
  ResponseFormatter.success(res, call, 'Call answered');
}));

// PATCH /api/calls/:id/decline
router.patch('/:id/decline', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const call = await Call.findOne({
    where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
  });
  if (!call) return ResponseFormatter.error(res, 'Call not found', 404);
  await call.update({ status: 'Declined', endedAt: new Date() } as any);
  ResponseFormatter.success(res, call, 'Call declined');
}));

// PATCH /api/calls/:id/end
router.patch('/:id/end', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const call = await Call.findOne({
    where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
  });
  if (!call) return ResponseFormatter.error(res, 'Call not found', 404);
  const endedAt = new Date();
  const startedAt = (call as any).startedAt;
  const durationSeconds = startedAt
    ? Math.floor((endedAt.getTime() - new Date(startedAt).getTime()) / 1000)
    : 0;
  await call.update({ status: 'Ended', endedAt, durationSeconds } as any);
  ResponseFormatter.success(res, call, 'Call ended');
}));

export default router;
