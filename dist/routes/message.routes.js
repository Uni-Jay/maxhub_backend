"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Conversation_model_1 = require("../models/Conversation.model");
const ConversationParticipant_model_1 = require("../models/ConversationParticipant.model");
const Message_model_1 = require("../models/Message.model");
const MessageRead_model_1 = require("../models/MessageRead.model");
const User_model_1 = require("../models/User.model");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
router.get('/conversations', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const myConversationIds = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { userId: user.id },
        attributes: ['conversationId'],
    });
    const ids = myConversationIds.map((p) => p.conversationId);
    const conversations = await Conversation_model_1.Conversation.findAll({
        where: { id: { [sequelize_1.Op.in]: ids } },
        order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, conversations);
}));
router.post('/conversations', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { title, conversationType, participantUserIds } = req.body;
    if (!title || !conversationType)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title and conversationType are required', 400);
    const count = await Conversation_model_1.Conversation.count();
    const conversationCode = `CONV-${String(count + 1).padStart(6, '0')}`;
    const conversation = await Conversation_model_1.Conversation.create({
        uuid: (0, uuid_1.v4)(), conversationCode, title, conversationType,
        createdById: user.id, isArchived: false,
    });
    const allParticipants = [...new Set([user.id, ...(participantUserIds || [])])];
    await Promise.all(allParticipants.map((uid) => ConversationParticipant_model_1.ConversationParticipant.create({ conversationId: conversation.id, userId: uid })));
    ResponseFormatter_1.ResponseFormatter.success(res, conversation, 'Conversation created', 201);
}));
router.get('/conversations/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] },
    });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const isParticipant = await ConversationParticipant_model_1.ConversationParticipant.findOne({
        where: { conversationId: conversation.id, userId: user.id },
    });
    if (!isParticipant)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Access denied', 403);
    const participants = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { conversationId: conversation.id },
        include: [{ model: User_model_1.User, attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, { ...conversation.toJSON(), participants });
}));
router.patch('/conversations/:id/archive', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    await conversation.update({ isArchived: !conversation.isArchived });
    ResponseFormatter_1.ResponseFormatter.success(res, conversation, 'Archive status toggled');
}));
router.post('/conversations/:id/participants', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds))
        return ResponseFormatter_1.ResponseFormatter.error(res, 'userIds array required', 400);
    await Promise.all(userIds.map((uid) => ConversationParticipant_model_1.ConversationParticipant.findOrCreate({
        where: { conversationId: conversation.id, userId: uid },
        defaults: { conversationId: conversation.id, userId: uid },
    })));
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Participants added');
}));
router.delete('/conversations/:id/participants/:userId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    await ConversationParticipant_model_1.ConversationParticipant.destroy({
        where: { conversationId: conversation.id, userId: req.params.userId },
    });
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Participant removed');
}));
router.get('/conversations/:id/messages', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const { count, rows } = await Message_model_1.Message.findAndCountAll({
        where: { conversationId: conversation.id },
        include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        order: [['createdAt', 'DESC']],
        limit: Number(limit), offset,
    });
    ResponseFormatter_1.ResponseFormatter.paginated(res, rows.reverse(), count, Number(page), Number(limit));
}));
router.post('/conversations/:id/messages', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { [sequelize_1.Op.or]: [{ id: req.params.id }, { uuid: req.params.id }] } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const { messageText, messageType, replyToMessageId, attachmentUrl } = req.body;
    if (!messageText)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'messageText is required', 400);
    const message = await Message_model_1.Message.create({
        uuid: (0, uuid_1.v4)(), conversationId: conversation.id, senderUserId: user.id,
        messageText, messageType: messageType || 'Text',
        replyToMessageId, attachmentUrl, isEdited: false, isPinned: false,
    });
    await conversation.update({ lastMessageAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, message, 'Message sent', 201);
}));
router.patch('/conversations/:convId/messages/:msgId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const message = await Message_model_1.Message.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    if (message.senderUserId !== user.id)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Can only edit your own messages', 403);
    const { messageText } = req.body;
    if (!messageText)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'messageText is required', 400);
    await message.update({ messageText, isEdited: true, editedAt: new Date() });
    ResponseFormatter_1.ResponseFormatter.success(res, message, 'Message edited');
}));
router.delete('/conversations/:convId/messages/:msgId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const message = await Message_model_1.Message.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    if (message.senderUserId !== user.id)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Can only delete your own messages', 403);
    await message.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Message deleted');
}));
router.patch('/conversations/:convId/messages/:msgId/pin', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const message = await Message_model_1.Message.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    await message.update({ isPinned: !message.isPinned });
    ResponseFormatter_1.ResponseFormatter.success(res, message, 'Pin status toggled');
}));
router.patch('/conversations/:convId/messages/:msgId/react', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { emoji } = req.body;
    if (!emoji)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'emoji is required', 400);
    const message = await Message_model_1.Message.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.msgId }, { uuid: req.params.msgId }] },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    const reactions = message.reactions || {};
    const users = reactions[emoji] || [];
    if (users.includes(user.id)) {
        reactions[emoji] = users.filter((id) => id !== user.id);
        if (reactions[emoji].length === 0)
            delete reactions[emoji];
    }
    else {
        reactions[emoji] = [...users, user.id];
    }
    await message.update({ reactions: { ...reactions } });
    ResponseFormatter_1.ResponseFormatter.success(res, message, 'Reaction updated');
}));
router.post('/conversations/:convId/read', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({
        where: { [sequelize_1.Op.or]: [{ id: req.params.convId }, { uuid: req.params.convId }] },
    });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const conversationId = conversation.id;
    const messages = await Message_model_1.Message.findAll({
        where: { conversationId, senderUserId: { [sequelize_1.Op.ne]: user.id } },
        attributes: ['id'],
    });
    await Promise.all(messages.map((msg) => MessageRead_model_1.MessageRead.findOrCreate({
        where: { messageId: msg.id, userId: user.id },
        defaults: { messageId: msg.id, userId: user.id, readAt: new Date() },
    })));
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Marked as read');
}));
exports.default = router;
//# sourceMappingURL=message.routes.js.map