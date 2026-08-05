"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUsers = void 0;
exports.emitToUser = emitToUser;
exports.initChatSocket = initChatSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const sequelize_1 = require("sequelize");
const Conversation_model_1 = require("@models/Conversation.model");
const ConversationParticipant_model_1 = require("@models/ConversationParticipant.model");
const Message_model_1 = require("@models/Message.model");
const MessageRead_model_1 = require("@models/MessageRead.model");
const User_model_1 = require("@models/User.model");
const mentions_1 = require("@utils/mentions");
const messageTypes_1 = require("@utils/messageTypes");
const onlineUsers = new Map();
exports.onlineUsers = onlineUsers;
const socketUserMap = new Map();
const typingUsers = new Map();
function getUserSockets(userId) {
    return onlineUsers.get(userId) ?? new Set();
}
function emitToUser(io, userId, event, payload) {
    for (const sockId of getUserSockets(userId)) {
        io.to(sockId).emit(event, payload);
    }
}
function broadcastPresence(io, userId, isOnline) {
    io.emit('user:presence', { userId, isOnline, lastSeen: new Date().toISOString() });
}
function initChatSocket(httpServer) {
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',');
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, cb) => {
                if (!origin || allowedOrigins.includes(origin) || origin.includes('onrender.com') || origin.includes('vercel.app') || origin.includes('netlify.app')) {
                    cb(null, true);
                }
                else {
                    cb(null, true);
                }
            },
            credentials: true,
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token)
                return next(new Error('Authentication required'));
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const payload = jsonwebtoken_1.default.verify(token, secret);
            socket.userId = Number(payload.id || payload.userId);
            socket.userEmail = payload.email;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', async (socket) => {
        const userId = socket.userId;
        if (!onlineUsers.has(userId))
            onlineUsers.set(userId, new Set());
        onlineUsers.get(userId).add(socket.id);
        socketUserMap.set(socket.id, userId);
        broadcastPresence(io, userId, true);
        try {
            const participations = await ConversationParticipant_model_1.ConversationParticipant.findAll({
                where: { userId },
                attributes: ['conversationId'],
            });
            for (const p of participations) {
                socket.join(`conv:${p.conversationId}`);
            }
        }
        catch (err) {
            console.error(`[ChatSocket] Failed to join conversation rooms for user ${userId}:`, err);
        }
        const onlineList = Array.from(onlineUsers.entries())
            .filter(([, sockets]) => sockets.size > 0)
            .map(([uid]) => uid);
        socket.emit('user:online_list', onlineList);
        socket.on('chat:typing_start', ({ conversationId }) => {
            const key = String(conversationId);
            if (!typingUsers.has(key))
                typingUsers.set(key, new Set());
            typingUsers.get(key).add(userId);
            socket.to(`conv:${conversationId}`).emit('chat:typing', { conversationId, userId });
        });
        socket.on('chat:typing_stop', ({ conversationId }) => {
            const key = String(conversationId);
            typingUsers.get(key)?.delete(userId);
            socket.to(`conv:${conversationId}`).emit('chat:stop_typing', { conversationId, userId });
        });
        socket.on('chat:send', async (data, ack) => {
            try {
                const conversation = await Conversation_model_1.Conversation.findByPk(data.conversationId);
                if (!conversation)
                    return ack?.({ error: 'Conversation not found' });
                const isParticipant = await ConversationParticipant_model_1.ConversationParticipant.findOne({
                    where: { conversationId: data.conversationId, userId },
                });
                if (!isParticipant)
                    return ack?.({ error: 'Not a participant' });
                const message = await Message_model_1.Message.create({
                    uuid: (0, uuid_1.v4)(),
                    conversationId: data.conversationId,
                    senderUserId: userId,
                    messageText: data.messageText || '',
                    messageType: (0, messageTypes_1.sanitizeMessageType)(data.messageType, !!data.attachmentUrl),
                    attachmentUrl: data.attachmentUrl,
                    attachmentType: data.attachmentType,
                    attachmentName: data.attachmentName,
                    attachmentSize: data.attachmentSize,
                    attachmentDuration: data.attachmentDuration,
                    replyToMessageId: data.replyToMessageId,
                    isEdited: false,
                    isPinned: false,
                    reactions: {},
                    starredByUserIds: [],
                });
                await conversation.update({ lastMessageAt: new Date() });
                const full = await Message_model_1.Message.findByPk(message.id, {
                    include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
                });
                const payload = { ...(full?.toJSON() ?? message.toJSON()), tempId: data.tempId };
                io.to(`conv:${data.conversationId}`).emit('chat:message', payload);
                const senderInfo = full?.sender;
                const senderName = senderInfo ? `${senderInfo.firstName || ''} ${senderInfo.lastName || ''}`.trim() : 'Someone';
                (0, mentions_1.detectAndNotifyMentions)({
                    messageText: data.messageText || '', conversationId: data.conversationId, messageId: message.id,
                    senderUserId: userId, senderName, io,
                }).catch(() => { });
                ack?.({ success: true, message: payload });
            }
            catch (err) {
                ack?.({ error: err.message || 'Send failed' });
            }
        });
        socket.on('chat:edit', async (data, ack) => {
            try {
                const msg = await Message_model_1.Message.findByPk(data.messageId);
                if (!msg)
                    return ack?.({ error: 'Message not found' });
                if (String(msg.senderUserId) !== String(userId))
                    return ack?.({ error: 'Forbidden' });
                await msg.update({ messageText: data.messageText, isEdited: true, editedAt: new Date() });
                const convId = msg.conversationId;
                io.to(`conv:${convId}`).emit('chat:edited', { messageId: data.messageId, messageText: data.messageText, editedAt: new Date().toISOString() });
                ack?.({ success: true });
            }
            catch (err) {
                ack?.({ error: err.message });
            }
        });
        socket.on('chat:delete', async (data, ack) => {
            try {
                const msg = await Message_model_1.Message.findByPk(data.messageId);
                if (!msg)
                    return ack?.({ error: 'Message not found' });
                const convId = msg.conversationId;
                if (data.deleteForEveryone) {
                    if (String(msg.senderUserId) !== String(userId))
                        return ack?.({ error: 'Can only delete your own messages for everyone' });
                    await msg.update({ messageText: '🚫 This message was deleted', messageType: 'Text', attachmentUrl: null });
                    io.to(`conv:${convId}`).emit('chat:deleted', { messageId: data.messageId, deleteForEveryone: true });
                }
                else {
                    const existing = msg.deletedForUserIds || [];
                    if (!existing.includes(userId)) {
                        await msg.update({ deletedForUserIds: [...existing, userId] });
                    }
                    socket.emit('chat:deleted', { messageId: data.messageId, deleteForEveryone: false });
                }
                ack?.({ success: true });
            }
            catch (err) {
                ack?.({ error: err.message });
            }
        });
        socket.on('chat:react', async (data, ack) => {
            try {
                const msg = await Message_model_1.Message.findByPk(data.messageId);
                if (!msg)
                    return ack?.({ error: 'Message not found' });
                const reactions = msg.reactions || {};
                const users = reactions[data.emoji] || [];
                if (users.includes(userId)) {
                    reactions[data.emoji] = users.filter(id => id !== userId);
                    if (reactions[data.emoji].length === 0)
                        delete reactions[data.emoji];
                }
                else {
                    reactions[data.emoji] = [...users, userId];
                }
                await msg.update({ reactions: { ...reactions } });
                const convId = msg.conversationId;
                io.to(`conv:${convId}`).emit('chat:reaction', { messageId: data.messageId, reactions, userId, emoji: data.emoji });
                ack?.({ success: true, reactions });
            }
            catch (err) {
                ack?.({ error: err.message });
            }
        });
        socket.on('chat:pin', async (data, ack) => {
            try {
                const msg = await Message_model_1.Message.findByPk(data.messageId);
                if (!msg)
                    return ack?.({ error: 'Message not found' });
                const newPinned = !msg.isPinned;
                await msg.update({ isPinned: newPinned });
                const convId = msg.conversationId;
                io.to(`conv:${convId}`).emit('chat:pinned', { messageId: data.messageId, isPinned: newPinned });
                ack?.({ success: true });
            }
            catch (err) {
                ack?.({ error: err.message });
            }
        });
        socket.on('chat:read', async (data, ack) => {
            try {
                const messages = await Message_model_1.Message.findAll({
                    where: { conversationId: data.conversationId, senderUserId: { [sequelize_1.Op.ne]: userId } },
                    attributes: ['id'],
                });
                await Promise.all(messages.map((m) => MessageRead_model_1.MessageRead.findOrCreate({
                    where: { messageId: m.id, userId },
                    defaults: { messageId: m.id, userId, readAt: new Date() },
                })));
                await ConversationParticipant_model_1.ConversationParticipant.update({ lastSeenAt: new Date() }, { where: { conversationId: data.conversationId, userId } });
                const senderIds = [...new Set(messages.map((m) => Number(m.senderUserId)))];
                for (const sid of senderIds) {
                    const sockets = getUserSockets(sid);
                    for (const sockId of sockets) {
                        io.to(sockId).emit('chat:read_receipt', { conversationId: data.conversationId, readBy: userId, readAt: new Date().toISOString() });
                    }
                }
                ack?.({ success: true });
            }
            catch (err) {
                ack?.({ error: err.message });
            }
        });
        socket.on('chat:join', async ({ conversationId }) => {
            try {
                const isParticipant = await ConversationParticipant_model_1.ConversationParticipant.findOne({
                    where: { conversationId, userId },
                });
                if (isParticipant)
                    socket.join(`conv:${conversationId}`);
            }
            catch {
            }
        });
        socket.on('disconnect', () => {
            const sockets = onlineUsers.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    onlineUsers.delete(userId);
                    broadcastPresence(io, userId, false);
                }
            }
            socketUserMap.delete(socket.id);
        });
    });
    return io;
}
//# sourceMappingURL=ChatSocket.js.map