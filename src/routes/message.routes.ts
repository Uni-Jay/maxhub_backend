import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '@models/Conversation.model';
import { ConversationParticipant } from '@models/ConversationParticipant.model';
import { Message } from '@models/Message.model';
import { MessageRead } from '@models/MessageRead.model';
import { User } from '@models/User.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = Router();

// GET /api/messages/conversations — my conversations
router.get('/conversations', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const myConversationIds = await ConversationParticipant.findAll({
    where: { userId: user.id },
    attributes: ['conversationId'],
  });
  const ids = myConversationIds.map((p: any) => p.conversationId);

  const conversations = await Conversation.findAll({
    where: { id: { [Op.in]: ids } },
    order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
  });

  ResponseFormatter.success(res, conversations);
}));

// POST /api/messages/conversations — create conversation
router.post('/conversations', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { title, conversationType, participantUserIds } = req.body;
  if (!title || !conversationType) return ResponseFormatter.error(res, 'title and conversationType are required', 400);

  const count = await Conversation.count();
  const conversationCode = `CONV-${String(count + 1).padStart(6, '0')}`;

  const conversation = await Conversation.create({
    uuid: uuidv4(), conversationCode, title, conversationType,
    createdById: user.id, isArchived: false,
  } as any);

  const allParticipants = [...new Set([user.id, ...(participantUserIds || [])])];
  await Promise.all(allParticipants.map((uid: number) =>
    ConversationParticipant.create({ conversationId: (conversation as any).id, userId: uid } as any)
  ));

  ResponseFormatter.success(res, conversation, 'Conversation created', 201);
}));

// GET /api/messages/conversations/:id
router.get('/conversations/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({
    where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
  });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const isParticipant = await ConversationParticipant.findOne({
    where: { conversationId: (conversation as any).id, userId: user.id },
  });
  if (!isParticipant) return ResponseFormatter.error(res, 'Access denied', 403);

  const participants = await ConversationParticipant.findAll({
    where: { conversationId: (conversation as any).id },
    include: [{ model: User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }],
  });

  ResponseFormatter.success(res, { ...conversation.toJSON(), participants });
}));

// PATCH /api/messages/conversations/:id/archive
router.patch('/conversations/:id/archive', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);
  await conversation.update({ isArchived: !(conversation as any).isArchived });
  ResponseFormatter.success(res, conversation, 'Archive status toggled');
}));

// POST /api/messages/conversations/:id/participants
router.post('/conversations/:id/participants', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const { userIds } = req.body;
  if (!userIds || !Array.isArray(userIds)) return ResponseFormatter.error(res, 'userIds array required', 400);

  await Promise.all(userIds.map((uid: number) =>
    ConversationParticipant.findOrCreate({
      where: { conversationId: (conversation as any).id, userId: uid },
      defaults: { conversationId: (conversation as any).id, userId: uid } as any,
    })
  ));
  ResponseFormatter.success(res, null, 'Participants added');
}));

// DELETE /api/messages/conversations/:id/participants/:userId
router.delete('/conversations/:id/participants/:userId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const conversation = await Conversation.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  await ConversationParticipant.destroy({
    where: { conversationId: (conversation as any).id, userId: req.params.userId },
  });
  ResponseFormatter.success(res, null, 'Participant removed');
}));

// GET /api/messages/conversations/:id/messages
router.get('/conversations/:id/messages', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const conversation = await Conversation.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const { count, rows } = await Message.findAndCountAll({
    where: { conversationId: (conversation as any).id },
    include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
    order: [['createdAt', 'DESC']],
    limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows.reverse(), count, Number(page), Number(limit));
}));

// POST /api/messages/conversations/:id/messages — send message
router.post('/conversations/:id/messages', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({ where: { [Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const { messageText, messageType, replyToMessageId, attachmentUrl } = req.body;
  if (!messageText) return ResponseFormatter.error(res, 'messageText is required', 400);

  const message = await Message.create({
    uuid: uuidv4(), conversationId: (conversation as any).id, senderUserId: user.id,
    messageText, messageType: messageType || 'Text',
    replyToMessageId, attachmentUrl, isEdited: false, isPinned: false,
  } as any);

  await conversation.update({ lastMessageAt: new Date() });

  ResponseFormatter.success(res, message, 'Message sent', 201);
}));

// PATCH /api/messages/conversations/:convId/messages/:msgId — edit message
router.patch('/conversations/:convId/messages/:msgId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const message = await Message.findOne({
    where: { [Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
  });
  if (!message) return ResponseFormatter.error(res, 'Message not found', 404);
  if ((message as any).senderUserId !== user.id) return ResponseFormatter.error(res, 'Can only edit your own messages', 403);

  const { messageText } = req.body;
  if (!messageText) return ResponseFormatter.error(res, 'messageText is required', 400);

  await message.update({ messageText, isEdited: true, editedAt: new Date() });
  ResponseFormatter.success(res, message, 'Message edited');
}));

// DELETE /api/messages/conversations/:convId/messages/:msgId
router.delete('/conversations/:convId/messages/:msgId', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const message = await Message.findOne({
    where: { [Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
  });
  if (!message) return ResponseFormatter.error(res, 'Message not found', 404);
  if ((message as any).senderUserId !== user.id) return ResponseFormatter.error(res, 'Can only delete your own messages', 403);

  await message.destroy();
  ResponseFormatter.success(res, null, 'Message deleted');
}));

// PATCH /api/messages/conversations/:convId/messages/:msgId/pin
router.patch('/conversations/:convId/messages/:msgId/pin', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const message = await Message.findOne({
    where: { [Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
  });
  if (!message) return ResponseFormatter.error(res, 'Message not found', 404);
  await message.update({ isPinned: !(message as any).isPinned });
  ResponseFormatter.success(res, message, 'Pin status toggled');
}));

// PATCH /api/messages/conversations/:convId/messages/:msgId/react — toggle emoji reaction
router.patch('/conversations/:convId/messages/:msgId/react', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { emoji } = req.body;
  if (!emoji) return ResponseFormatter.error(res, 'emoji is required', 400);

  const message = await Message.findOne({
    where: { [Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
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

  await message.update({ reactions: { ...reactions } });
  ResponseFormatter.success(res, message, 'Reaction updated');
}));

// POST /api/messages/conversations/:convId/read — mark all conversation messages as read
router.post('/conversations/:convId/read', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversation = await Conversation.findOne({
    where: { [Op.or]: [{ id: req.params.convId }, { uuid: req.params.convId }] },
  });
  if (!conversation) return ResponseFormatter.error(res, 'Conversation not found', 404);

  const conversationId = (conversation as any).id;
  const messages = await Message.findAll({
    where: { conversationId, senderUserId: { [Op.ne]: user.id } },
    attributes: ['id'],
  });

  await Promise.all(messages.map((msg: any) =>
    MessageRead.findOrCreate({
      where: { messageId: msg.id, userId: user.id },
      defaults: { messageId: msg.id, userId: user.id, readAt: new Date() } as any,
    })
  ));

  ResponseFormatter.success(res, null, 'Marked as read');
}));

export default router;
