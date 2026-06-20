import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Conversation } from '@models/Conversation.model';
import { ConversationParticipant } from '@models/ConversationParticipant.model';
import { Message } from '@models/Message.model';
import { MessageRead } from '@models/MessageRead.model';
import { User } from '@models/User.model';
import { Staff } from '@models/Staff.model';
import { Call } from '@models/Call.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { AuthMiddleware } from '@middleware/AuthMiddleware';
import { emitToUser } from '../socket/ChatSocket';

const router = Router();

// ─── Chat file upload (images, docs, audio, video) ───────────────────────────
const CHAT_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'chat');
const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => { fs.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true }); cb(null, CHAT_UPLOAD_DIR); },
  filename: (_req, file, cb) => { cb(null, `${uuidv4()}${path.extname(file.originalname).toLowerCase()}`); },
});
const CHAT_ALLOWED = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.mp4', '.webm', '.mp3', '.wav', '.ogg', '.m4a', '.zip', '.rar'];
const chatUpload = multer({
  storage: chatStorage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    CHAT_ALLOWED.includes(ext) ? cb(null, true) : cb(new Error(`File type ${ext} not allowed`));
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// POST /api/messages/upload — upload a chat attachment, returns { url, type, name, size }
router.post('/upload', AuthMiddleware.verifyToken, chatUpload.single('file'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return ResponseFormatter.error(res, 'No file uploaded', 400);
  const ext = path.extname(req.file.originalname).toLowerCase();
  let type = 'Document';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) type = 'Image';
  else if (['.mp4', '.webm'].includes(ext)) type = 'Video';
  else if (['.mp3', '.wav', '.ogg', '.m4a', '.webm'].includes(ext)) type = 'Audio';
  const url = `/uploads/chat/${req.file.filename}`;
  return ResponseFormatter.success(res, { url, type, name: req.file.originalname, size: req.file.size }, 'File uploaded');
}));

// ─────────────────────────────────────────────────────────────────────────────
// USER SEARCH (for starting new chats)
// GET /api/messages/users/search?q=&limit=20
// ─────────────────────────────────────────────────────────────────────────────
router.get('/users/search', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const q = (req.query.q as string) || '';
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const where: any = {
    id: { [Op.ne]: user.id },
  };

  if (q.trim()) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${q}%` } },
      { lastName: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
    ];
  }

  const users = await User.findAll({
    where,
    attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
    limit,
    order: [['firstName', 'ASC']],
  });

  ResponseFormatter.success(res, users);
}));

// ─────────────────────────────────────────────────────────────────────────────
// ONLINE USERS  GET /api/messages/users/online
// ─────────────────────────────────────────────────────────────────────────────
router.get('/users/online', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  // Read from Socket.IO online map via app instance
  const io = (req as any).app?.get('io');
  let onlineIds: number[] = [];
  if (io) {
    const { onlineUsers } = await import('../socket/ChatSocket');
    onlineIds = Array.from(onlineUsers.entries())
      .filter(([, sockets]) => sockets.size > 0)
      .map(([uid]) => uid);
  }
  ResponseFormatter.success(res, { onlineUserIds: onlineIds });
}));

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATIONS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/messages/conversations
router.get('/conversations', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const participations = await ConversationParticipant.findAll({
    where: { userId: user.id },
    attributes: ['conversationId', 'role', 'isMuted', 'lastSeenAt'],
  });
  const ids = participations.map((p: any) => p.conversationId);
  if (ids.length === 0) return ResponseFormatter.success(res, []);

  const conversations = await Conversation.findAll({
    where: { id: { [Op.in]: ids } },
    order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
  });

  // Attach last message, unread count, participant meta
  const enriched = await Promise.all(conversations.map(async (conv: any) => {
    const lastMsg = await Message.findOne({
      where: { conversationId: conv.id },
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['createdAt', 'DESC']],
    });

    const totalMsgs = await Message.count({
      where: { conversationId: conv.id, senderUserId: { [Op.ne]: user.id } },
    }).catch(() => 0);
    const readMsgs = await MessageRead.count({
      where: { userId: user.id },
      include: [{ model: Message, where: { conversationId: conv.id }, required: true }] as any,
    }).catch(() => 0);
    const unreadCount = Math.max(0, totalMsgs - readMsgs);

    const myParticipation = participations.find((p: any) => p.conversationId === conv.id);

    // The frontend reads p.user.firstName/lastName/avatar for member lists,
    // online dots, and DM display names — needs the same alias as the
    // detail endpoint below.
    const allParticipants = await ConversationParticipant.findAll({
      where: { conversationId: conv.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
    });

    return {
      ...conv.toJSON(),
      lastMessage: lastMsg?.toJSON() ?? null,
      unreadCount,
      myRole: (myParticipation as any)?.role ?? 'Member',
      isMuted: (myParticipation as any)?.isMuted ?? false,
      participants: allParticipants,
    };
  }));

  ResponseFormatter.success(res, enriched);
}));

// POST /api/messages/conversations
router.post('/conversations', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { title, conversationType, participantUserIds, description, image } = req.body;
  if (!title || !conversationType) return ResponseFormatter.error(res, 'title and conversationType are required', 400);

  const count = await Conversation.count();
  const conversationCode = `CONV-${String(count + 1).padStart(6, '0')}`;

  const conversation = await Conversation.create({
    uuid: uuidv4(), conversationCode, title, conversationType,
    createdById: user.id, isArchived: false,
  } as any);

  const allParticipants = [...new Set([user.id, ...(participantUserIds || [])])];
  await Promise.all(allParticipants.map((uid: number, idx: number) =>
    ConversationParticipant.create({
      uuid: uuidv4(),
      conversationId: (conversation as any).id,
      userId: uid,
      role: idx === 0 ? 'Admin' : 'Member',
      joinedAt: new Date(),
      isMuted: false,
    } as any)
  ));

  // Notify Socket.IO to join room — targets each participant's actual
  // connected sockets (a "user:{id}" room nobody ever joins was previously
  // used here and silently reached no one).
  const io = (req as any).app?.get('io');
  if (io) {
    for (const uid of allParticipants) {
      emitToUser(io, uid, 'chat:join', { conversationId: (conversation as any).id });
    }
  }

  ResponseFormatter.success(res, conversation, 'Conversation created', 201);
}));

// POST /api/messages/conversations/find-or-create — find or start a DM
router.post('/conversations/find-or-create', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { userId: otherUserId } = req.body;
  if (!otherUserId) return ResponseFormatter.error(res, 'userId is required', 400);

  // Find existing Direct conversation shared by both
  const myConvIds = await ConversationParticipant.findAll({
    where: { userId: user.id },
    attributes: ['conversationId'],
  });
  const myIds = myConvIds.map((p: any) => p.conversationId);

  const otherConvIds = await ConversationParticipant.findAll({
    where: { userId: otherUserId },
    attributes: ['conversationId'],
  });
  const otherIds = otherConvIds.map((p: any) => p.conversationId);

  const sharedIds = myIds.filter((id: any) => otherIds.some((oid: any) => String(oid) === String(id)));

  if (sharedIds.length > 0) {
    const existing = await Conversation.findOne({
      where: { id: { [Op.in]: sharedIds }, conversationType: 'Direct' },
    });
    if (existing) {
      const participants = await ConversationParticipant.findAll({
        where: { conversationId: (existing as any).id },
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
      });
      return ResponseFormatter.success(res, { ...existing.toJSON(), participants, isNew: false });
    }
  }

  // Create new DM
  const otherUser = await User.findByPk(otherUserId, { attributes: ['id', 'firstName', 'lastName'] });
  if (!otherUser) return ResponseFormatter.error(res, 'User not found', 404);

  const count = await Conversation.count();
  const conversationCode = `CONV-${String(count + 1).padStart(6, '0')}`;
  const title = `${(otherUser as any).firstName} ${(otherUser as any).lastName}`;

  const conversation = await Conversation.create({
    uuid: uuidv4(), conversationCode, title, conversationType: 'Direct',
    createdById: user.id, isArchived: false,
  } as any);

  await Promise.all([user.id, otherUserId].map((uid: number, idx: number) =>
    ConversationParticipant.create({
      uuid: uuidv4(),
      conversationId: (conversation as any).id,
      userId: uid,
      role: idx === 0 ? 'Admin' : 'Member',
      joinedAt: new Date(),
      isMuted: false,
    } as any)
  ));

  const participants = await ConversationParticipant.findAll({
    where: { conversationId: (conversation as any).id },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
  });

  // Tell both users to join the socket room — previously a bare io.emit(),
  // which broadcasts to every connected user, not just these two; combined
  // with chat:join's old unconditional socket.join(), any online user's
  // socket could end up subscribed to a DM room it isn't part of.
  const io = (req as any).app?.get('io');
  if (io) {
    emitToUser(io, user.id, 'chat:join', { conversationId: (conversation as any).id });
    emitToUser(io, otherUserId, 'chat:join', { conversationId: (conversation as any).id });
  }

  ResponseFormatter.success(res, { ...conversation.toJSON(), participants, isNew: true }, 'Direct message created', 201);
}));

// GET /api/messages/conversations/:id
router.get('/conversations/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
  });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const isParticipant = await ConversationParticipant.findOne({
    where: { conversationId: (conversation as any).id, userId: user.id },
  });
  if (!isParticipant) return ResponseFormatter.error(res, 'Access denied', 403);

  const participants = await ConversationParticipant.findAll({
    where: { conversationId: (conversation as any).id },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }],
  });

  ResponseFormatter.success(res, { ...conversation.toJSON(), participants });
}));

// PATCH /api/messages/conversations/:id/archive
router.patch('/conversations/:id/archive', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);
  await conversation.update({ isArchived: !(conversation as any).isArchived });
  ResponseFormatter.success(res, conversation, 'Archive status toggled');
}));

// PATCH /api/messages/conversations/:id/mute
router.patch('/conversations/:id/mute', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const participant = await ConversationParticipant.findOne({
    where: { conversationId: (conversation as any).id, userId: user.id },
  });
  if (!participant) return ResponseFormatter.error(res, 'Not a participant', 403);

  await participant.update({ isMuted: !(participant as any).isMuted });
  ResponseFormatter.success(res, participant, 'Mute status toggled');
}));

// DELETE /api/messages/conversations/:id — leave / delete conversation
router.delete('/conversations/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  await ConversationParticipant.destroy({
    where: { conversationId: (conversation as any).id, userId: user.id },
  });
  ResponseFormatter.success(res, null, 'Left conversation');
}));

// POST /api/messages/conversations/:id/participants
router.post('/conversations/:id/participants', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) return ResponseFormatter.error(res, 'userIds array required', 400);

  await Promise.all(userIds.map((uid: number) =>
    ConversationParticipant.findOrCreate({
      where: { conversationId: (conversation as any).id, userId: uid },
      defaults: {
        uuid: uuidv4(),
        conversationId: (conversation as any).id,
        userId: uid,
        role: 'Member',
        joinedAt: new Date(),
        isMuted: false,
      } as any,
    })
  ));

  const io = (req as any).app?.get('io');
  if (io) {
    for (const uid of userIds) {
      emitToUser(io, uid, 'chat:join', { conversationId: (conversation as any).id });
    }
  }

  ResponseFormatter.success(res, null, 'Participants added');
}));

// DELETE /api/messages/conversations/:id/participants/:userId
router.delete('/conversations/:id/participants/:userId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  await ConversationParticipant.destroy({
    where: { conversationId: (conversation as any).id, userId: req.params.userId },
  });
  ResponseFormatter.success(res, null, 'Participant removed');
}));

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { page = 1, limit = 50, before } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const isParticipant = await ConversationParticipant.findOne({
    where: { conversationId: (conversation as any).id, userId: user.id },
  });
  if (!isParticipant) return ResponseFormatter.error(res, 'Access denied', 403);

  const whereClause: any = { conversationId: (conversation as any).id };
  if (before) whereClause.createdAt = { [Op.lt]: new Date(before as string) };

  const { count, rows } = await Message.findAndCountAll({
    where: whereClause,
    include: [
      { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      {
        model: Message, as: 'replyTo',
        include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
        required: false,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: Number(limit), offset,
  });

  // "Delete for me" hides a message from just the requesting user's view —
  // filtered client-side post-query rather than pushed into the WHERE
  // clause, so this is a small pagination-count approximation, not exact.
  const visible = rows.filter((m: any) => !(m.deletedForUserIds || []).includes(user.id));

  ResponseFormatter.paginated(res, visible.reverse(), count, Number(page), Number(limit));
}));

// POST /api/messages/conversations/:id/messages — send message
router.post('/conversations/:id/messages', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const { messageText, messageType, replyToMessageId, attachmentUrl, attachmentType } = req.body;
  if (!messageText) return ResponseFormatter.error(res, 'messageText is required', 400);

  const message = await Message.create({
    uuid: uuidv4(), conversationId: (conversation as any).id, senderUserId: user.id,
    messageText, messageType: messageType || 'Text',
    replyToMessageId, attachmentUrl, attachmentType,
    isEdited: false, isPinned: false, reactions: {},
  } as any);

  await conversation.update({ lastMessageAt: new Date() });

  const full = await Message.findByPk((message as any).id, {
    include: [
      { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      {
        model: Message, as: 'replyTo',
        include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
        required: false,
      },
    ],
  });

  // Broadcast via Socket.IO
  const io = (req as any).app?.get('io');
  if (io) {
    io.to(`conv:${(conversation as any).id}`).emit('chat:message', full?.toJSON());
  }

  ResponseFormatter.success(res, full, 'Message sent', 201);
}));

// PATCH /api/messages/conversations/:convId/messages/:msgId — edit
router.patch('/conversations/:convId/messages/:msgId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const message = await Message.findOne({
    where: { ...idOrUuidWhere(req.params.msgId) },
  });
  if (!message) return ResponseFormatter.error(res, 'Message not found', 404);
  if ((message as any).senderUserId !== user.id) return ResponseFormatter.error(res, 'Can only edit your own messages', 403);

  const { messageText } = req.body;
  if (!messageText) return ResponseFormatter.error(res, 'messageText is required', 400);

  await message.update({ messageText, isEdited: true, editedAt: new Date() });

  const io = (req as any).app?.get('io');
  if (io) {
    const convId = (message as any).conversationId;
    io.to(`conv:${convId}`).emit('chat:edited', {
      messageId: (message as any).id,
      messageText,
      editedAt: new Date().toISOString(),
    });
  }

  ResponseFormatter.success(res, message, 'Message edited');
}));

// DELETE /api/messages/conversations/:convId/messages/:msgId
router.delete('/conversations/:convId/messages/:msgId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { everyone } = req.query;
  const message = await Message.findOne({
    where: { ...idOrUuidWhere(req.params.msgId) },
  });
  if (!message) return ResponseFormatter.error(res, 'Message not found', 404);

  const io = (req as any).app?.get('io');
  const convId = (message as any).conversationId;

  if (everyone === 'true') {
    if ((message as any).senderUserId !== user.id) return ResponseFormatter.error(res, 'Can only delete your own messages for everyone', 403);
    await message.update({ messageText: '🚫 This message was deleted', messageType: 'Text', attachmentUrl: null } as any);
    if (io) io.to(`conv:${convId}`).emit('chat:deleted', { messageId: (message as any).id, deleteForEveryone: true });
  } else {
    // "Delete for me" — any participant can hide a message from their own
    // view without affecting the sender or other participants. Previously
    // this called message.destroy(), a soft delete that removed the row
    // for *everyone*, not just the requester.
    const existing: number[] = (message as any).deletedForUserIds || [];
    if (!existing.includes(user.id)) {
      await message.update({ deletedForUserIds: [...existing, user.id] } as any);
    }
    if (io) emitToUser(io, user.id, 'chat:deleted', { messageId: (message as any).id, deleteForEveryone: false });
  }

  ResponseFormatter.success(res, null, 'Message deleted');
}));

// PATCH /api/messages/conversations/:convId/messages/:msgId/pin
router.patch('/conversations/:convId/messages/:msgId/pin', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const message = await Message.findOne({
    where: { ...idOrUuidWhere(req.params.msgId) },
  });
  if (!message) return ResponseFormatter.error(res, 'Message not found', 404);
  const newPinned = !(message as any).isPinned;
  await message.update({ isPinned: newPinned });

  const io = (req as any).app?.get('io');
  if (io) {
    const convId = (message as any).conversationId;
    io.to(`conv:${convId}`).emit('chat:pinned', { messageId: (message as any).id, isPinned: newPinned });
  }

  ResponseFormatter.success(res, message, 'Pin status toggled');
}));

// PATCH /api/messages/conversations/:convId/messages/:msgId/react
router.patch('/conversations/:convId/messages/:msgId/react', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { emoji } = req.body;
  if (!emoji) return ResponseFormatter.error(res, 'emoji is required', 400);

  const message = await Message.findOne({
    where: { ...idOrUuidWhere(req.params.msgId) },
  });
  if (!message) return ResponseFormatter.error(res, 'Message not found', 404);

  const reactions: Record<string, number[]> = ((message as any).reactions as any) || {};
  const users: number[] = reactions[emoji] || [];

  if (users.includes(user.id)) {
    reactions[emoji] = users.filter((id: number) => id !== user.id);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji] = [...users, user.id];
  }

  await message.update({ reactions: { ...reactions } as any });

  const io = (req as any).app?.get('io');
  if (io) {
    const convId = (message as any).conversationId;
    io.to(`conv:${convId}`).emit('chat:reaction', {
      messageId: (message as any).id, reactions, userId: user.id, emoji,
    });
  }

  ResponseFormatter.success(res, message, 'Reaction updated');
}));

// POST /api/messages/conversations/:convId/messages/:msgId/forward
router.post('/conversations/:convId/messages/:msgId/forward', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { targetConversationIds } = req.body;
  if (!targetConversationIds || !Array.isArray(targetConversationIds)) {
    return ResponseFormatter.error(res, 'targetConversationIds array required', 400);
  }

  const original = await Message.findOne({
    where: { ...idOrUuidWhere(req.params.msgId) },
  });
  if (!original) return ResponseFormatter.error(res, 'Message not found', 404);

  const forwarded = await Promise.all(targetConversationIds.map(async (convId: number) => {
    const conv = await Conversation.findByPk(convId);
    if (!conv) return null;

    const msg = await Message.create({
      uuid: uuidv4(), conversationId: convId, senderUserId: user.id,
      messageText: (original as any).messageText,
      messageType: (original as any).messageType,
      attachmentUrl: (original as any).attachmentUrl,
      isEdited: false, isPinned: false, reactions: {},
    } as any);

    await conv.update({ lastMessageAt: new Date() });

    const full = await Message.findByPk((msg as any).id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
    });

    const io = (req as any).app?.get('io');
    if (io) io.to(`conv:${convId}`).emit('chat:message', full?.toJSON());

    return full;
  }));

  ResponseFormatter.success(res, forwarded.filter(Boolean), 'Message forwarded', 201);
}));

// POST /api/messages/conversations/:convId/read
router.post('/conversations/:convId/read', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({
    where: { ...idOrUuidWhere(req.params.convId) },
  });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const conversationId = (conversation as any).id;
  const messages = await Message.findAll({
    where: { conversationId, senderUserId: { [Op.ne]: user.id } },
    attributes: ['id', 'senderUserId'],
  });

  await Promise.all(messages.map((msg: any) =>
    MessageRead.findOrCreate({
      where: { messageId: msg.id, userId: user.id },
      defaults: { messageId: msg.id, userId: user.id, readAt: new Date() } as any,
    })
  ));

  // Notify the room — covers every participant including the senders being
  // notified their message was read. (A redundant per-sender io.emit() with
  // a templated event name no client listened for used to sit here too —
  // it broadcast to every connected user globally and was pure dead weight.)
  const io = (req as any).app?.get('io');
  if (io) {
    io.to(`conv:${conversationId}`).emit('chat:read_receipt', { conversationId, readBy: user.id });
  }

  ResponseFormatter.success(res, null, 'Marked as read');
}));

// GET /api/messages/conversations/:id/pinned — get pinned messages
router.get('/conversations/:id/pinned', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const pinned = await Message.findAll({
    where: { conversationId: (conversation as any).id, isPinned: true },
    include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
    order: [['createdAt', 'DESC']],
  });
  ResponseFormatter.success(res, pinned);
}));

// GET /api/messages/conversations/:id/media — shared files and images
router.get('/conversations/:id/media', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  const conversation = await Conversation.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const typeFilter: any = {};
  if (type === 'images') typeFilter.messageType = 'Image';
  else if (type === 'files') typeFilter.messageType = 'File';
  else typeFilter.messageType = { [Op.in]: ['Image', 'File'] };

  const media = await Message.findAll({
    where: { conversationId: (conversation as any).id, ...typeFilter, attachmentUrl: { [Op.ne]: null } },
    include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['createdAt', 'DESC']],
    limit: 100,
  });
  ResponseFormatter.success(res, media);
}));

// GET /api/messages/search?q= — search messages globally
router.get('/search', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const q = (req.query.q as string) || '';
  if (!q.trim()) return ResponseFormatter.success(res, []);

  const participations = await ConversationParticipant.findAll({
    where: { userId: user.id },
    attributes: ['conversationId'],
  });
  const convIds = participations.map((p: any) => p.conversationId);

  const messages = await Message.findAll({
    where: {
      conversationId: { [Op.in]: convIds },
      messageText: { [Op.iLike]: `%${q}%` },
    },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      { model: Conversation, attributes: ['id', 'title', 'conversationType'] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 30,
  });

  ResponseFormatter.success(res, messages);
}));

// ─────────────────────────────────────────────────────────────────────────────
// CALL HISTORY  GET /api/messages/calls
// ─────────────────────────────────────────────────────────────────────────────
router.get('/calls', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const calls = await Call.findAll({
    where: {
      [Op.or]: [{ callerUserId: user.id }, { calleeUserId: user.id }],
    },
    include: [
      { model: User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
      { model: User, as: 'callee', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
  });

  ResponseFormatter.success(res, calls);
}));

export default router;
