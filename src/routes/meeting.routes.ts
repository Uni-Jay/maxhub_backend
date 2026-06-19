import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { Meeting } from '@models/Meeting.model';
import { MeetingParticipant } from '@models/MeetingParticipant.model';
import { User } from '@models/User.model';
import { Notification } from '@models/Notification.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';
import { PermissionCode } from '@config/PermissionCodes';

const router = Router();

const ALLOWED_MEETING_TYPES = ['Group', 'Department', 'Classroom', 'Interview', 'Training'];
const GOOGLE_MEET_URL = /^https:\/\/meet\.google\.com\/[a-z0-9-]+$/i;

/* ─── Helpers ─────────────────────────────────── */
function makeRoomName(title: string, code: string) {
  return `MaxHub-${code}-${title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 20)}`;
}

// GET /api/meetings — list
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status, type, page = 1, limit = 15 } = req.query;
  const user = (req as any).user;
  const offset = (Number(page) - 1) * Number(limit);

  // Get meetings where user is host or participant
  const participantMeetingIds = await MeetingParticipant.findAll({
    where: { userId: user.id },
    attributes: ['meetingId'],
  }).then((rows: any[]) => rows.map(r => r.meetingId));

  const where: any = {
    [Op.or]: [{ hostUserId: user.id }, { id: { [Op.in]: participantMeetingIds } }],
  };
  if (status) where.status = status;
  if (type) where.meetingType = type;

  const { count, rows } = await Meeting.findAndCountAll({
    where,
    include: [{ model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
    order: [['scheduledAt', 'ASC'], ['createdAt', 'DESC']],
    limit: Number(limit), offset,
  });

  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/meetings/analytics/summary
router.get('/analytics/summary', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const total = await Meeting.count();
  const totalByType = await Meeting.findAll({
    attributes: ['meetingType', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
    group: ['meetingType'],
    raw: true,
  });

  const participants = await MeetingParticipant.findAll({
    where: { joinedAt: { [Op.ne]: null as any } },
    attributes: ['durationSeconds'],
  });

  const totalDuration = participants.reduce((s: number, p: any) => s + (p.durationSeconds || 0), 0);

  ResponseFormatter.success(res, {
    totalMeetings: total,
    totalCalls: 0,
    totalMeetingDurationSeconds: totalDuration,
    totalCallDurationSeconds: 0,
    byType: Object.fromEntries(totalByType.map((r: any) => [r.meetingType, Number(r.count)])),
    attendanceRate: 0,
    byDepartment: [],
    topHosts: [],
  });
}));

// GET /api/meetings/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({
    where: { [Op.or]: [idOrUuidWhere(req.params.id), { meetingCode: req.params.id }] },
    include: [
      { model: User, as: 'host', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      {
        model: MeetingParticipant, as: 'participants',
        include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
      },
    ],
  });
  if (!meeting) return ResponseFormatter.error(res, 'Meeting not found', 404);
  ResponseFormatter.success(res, meeting);
}));

// POST /api/meetings — schedule. Super Admin/Admin/HR/HOD only — everyone else
// can join a meeting they're invited to, but can't create one.
router.post('/', AuthMiddleware.requirePermission(PermissionCode.MEETING_CREATE_ALL), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { title, meetingType, meetingLink, scheduledAt, durationMinutes, description, participantUserIds, maxParticipants } = req.body;
  if (!title) return ResponseFormatter.error(res, 'title is required', 400);
  if (!meetingLink || !GOOGLE_MEET_URL.test(meetingLink)) {
    return ResponseFormatter.error(res, 'A valid Google Meet link is required (e.g. https://meet.google.com/abc-defg-hij). Create one at meet.google.com/new and paste it here.', 400);
  }
  if (meetingType && !ALLOWED_MEETING_TYPES.includes(meetingType)) {
    return ResponseFormatter.error(res, `meetingType must be one of: ${ALLOWED_MEETING_TYPES.join(', ')}`, 400);
  }

  const count = await Meeting.count();
  const meetingCode = `MTG-${String(count + 1).padStart(6, '0')}`;
  const roomName = makeRoomName(title, meetingCode);

  const meeting = await Meeting.create({
    uuid: uuidv4(), meetingCode, title, description,
    meetingType: meetingType || 'Group',
    roomName, meetingLink, hostUserId: user.id,
    scheduledAt: scheduledAt || null,
    durationMinutes: durationMinutes || 60,
    status: 'Scheduled',
    maxParticipants: maxParticipants || null,
  } as any);

  const allParticipants = [...new Set([user.id, ...(participantUserIds || [])])];
  await Promise.all(allParticipants.map((uid: number) =>
    MeetingParticipant.create({
      meetingId: (meeting as any).id, userId: uid, status: uid === user.id ? 'Joined' : 'Invited',
    } as any)
  ));

  // Send the Google Meet link to everyone invited (host already knows it).
  const inviteeIds = allParticipants.filter((uid: number) => uid !== user.id);
  if (inviteeIds.length > 0) {
    await Notification.bulkCreate(
      inviteeIds.map((uid: number) => ({
        recipientUserId: uid,
        notificationType: 'System',
        title: `Meeting invite: ${title}`,
        message: scheduledAt
          ? `You're invited to "${title}" on ${new Date(scheduledAt).toLocaleString()}. Join via Google Meet.`
          : `You're invited to "${title}". Join via Google Meet.`,
        relatedEntityType: 'Meeting',
        relatedEntityId: (meeting as any).id,
        actionUrl: meetingLink,
        deliveryChannel: 'InApp',
        priority: 'Medium',
      })) as any
    );
  }

  ResponseFormatter.success(res, meeting, 'Meeting scheduled and link sent to all participants', 201);
}));

// PUT /api/meetings/:id
router.put('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!meeting) return ResponseFormatter.error(res, 'Meeting not found', 404);
  const { title, description, scheduledAt, durationMinutes, maxParticipants } = req.body;
  await meeting.update({ title, description, scheduledAt, durationMinutes, maxParticipants } as any);
  ResponseFormatter.success(res, meeting, 'Meeting updated');
}));

// PATCH /api/meetings/:id/cancel
router.patch('/:id/cancel', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!meeting) return ResponseFormatter.error(res, 'Meeting not found', 404);
  await meeting.update({ status: 'Cancelled' } as any);
  ResponseFormatter.success(res, meeting, 'Meeting cancelled');
}));

// POST /api/meetings/:id/join — record join time + set Live
router.post('/:id/join', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const meeting = await Meeting.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!meeting) return ResponseFormatter.error(res, 'Meeting not found', 404);

  await meeting.update({ status: 'Live' } as any);

  const [participant] = await MeetingParticipant.findOrCreate({
    where: { meetingId: (meeting as any).id, userId: user.id },
    defaults: { meetingId: (meeting as any).id, userId: user.id, status: 'Joined', joinedAt: new Date() } as any,
  });
  await participant.update({ joinedAt: new Date(), status: 'Joined' } as any);

  ResponseFormatter.success(res, { meetingLink: (meeting as any).meetingLink });
}));

// POST /api/meetings/:id/leave — record leave time + duration
router.post('/:id/leave', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const meeting = await Meeting.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!meeting) return ResponseFormatter.error(res, 'Meeting not found', 404);

  const participant = await MeetingParticipant.findOne({
    where: { meetingId: (meeting as any).id, userId: user.id },
  });
  if (participant) {
    const joinedAt = (participant as any).joinedAt;
    const leftAt = new Date();
    const durationSeconds = joinedAt ? Math.floor((leftAt.getTime() - new Date(joinedAt).getTime()) / 1000) : 0;
    await participant.update({ leftAt, durationSeconds } as any);
  }

  ResponseFormatter.success(res, null, 'Left meeting');
}));

// GET /api/meetings/:id/attendance
router.get('/:id/attendance', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!meeting) return ResponseFormatter.error(res, 'Meeting not found', 404);

  const participants = await MeetingParticipant.findAll({
    where: { meetingId: (meeting as any).id },
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
  });
  ResponseFormatter.success(res, participants);
}));

// POST /api/meetings/:id/recording
router.post('/:id/recording', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const meeting = await Meeting.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!meeting) return ResponseFormatter.error(res, 'Meeting not found', 404);
  const { recordingUrl, cloudinaryPublicId } = req.body;
  await meeting.update({ recordingUrl, cloudinaryPublicId, status: 'Ended' } as any);
  ResponseFormatter.success(res, { recordingUrl });
}));

export default router;
