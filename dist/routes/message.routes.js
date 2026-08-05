"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const idOrUuid_1 = require("@utils/idOrUuid");
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const Conversation_model_1 = require("@models/Conversation.model");
const ConversationParticipant_model_1 = require("@models/ConversationParticipant.model");
const Message_model_1 = require("@models/Message.model");
const MessageRead_model_1 = require("@models/MessageRead.model");
const User_model_1 = require("@models/User.model");
const Call_model_1 = require("@models/Call.model");
const ResponseFormatter_1 = require("@utils/ResponseFormatter");
const ErrorMiddleware_1 = require("@middleware/ErrorMiddleware");
const AuthMiddleware_1 = require("@middleware/AuthMiddleware");
const ChatSocket_1 = require("../socket/ChatSocket");
const mentions_1 = require("@utils/mentions");
const messageTypes_1 = require("@utils/messageTypes");
const router = (0, express_1.Router)();
function viewerTitle(conv, participants, viewerUserId) {
    if (conv.conversationType !== 'Direct')
        return conv.title;
    const other = participants.find((p) => String(p.userId) !== String(viewerUserId));
    const otherUser = other?.user;
    return otherUser ? `${otherUser.firstName} ${otherUser.lastName}`.trim() : conv.title;
}
const CHAT_UPLOAD_DIR = path_1.default.join(process.cwd(), 'uploads', 'chat');
const chatStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => { fs_1.default.mkdirSync(CHAT_UPLOAD_DIR, { recursive: true }); cb(null, CHAT_UPLOAD_DIR); },
    filename: (_req, file, cb) => { cb(null, `${(0, uuid_1.v4)()}${path_1.default.extname(file.originalname).toLowerCase()}`); },
});
const CHAT_ALLOWED = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.mp4', '.webm', '.mp3', '.wav', '.ogg', '.m4a', '.zip', '.rar'];
const chatUpload = (0, multer_1.default)({
    storage: chatStorage,
    fileFilter: (_req, file, cb) => {
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        CHAT_ALLOWED.includes(ext) ? cb(null, true) : cb(new Error(`File type ${ext} not allowed`));
    },
    limits: { fileSize: 25 * 1024 * 1024 },
});
router.post('/upload', AuthMiddleware_1.AuthMiddleware.verifyToken, chatUpload.single('file'), ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    if (!req.file)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'No file uploaded', 400);
    const ext = path_1.default.extname(req.file.originalname).toLowerCase();
    let type = 'Document';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext))
        type = 'Image';
    else if (['.mp4', '.webm'].includes(ext))
        type = 'Video';
    else if (['.mp3', '.wav', '.ogg', '.m4a', '.webm'].includes(ext))
        type = 'Audio';
    const url = `/uploads/chat/${req.file.filename}`;
    return ResponseFormatter_1.ResponseFormatter.success(res, { url, type, name: req.file.originalname, size: req.file.size }, 'File uploaded');
}));
router.get('/users/search', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const q = req.query.q || '';
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const where = {
        id: { [sequelize_1.Op.ne]: user.id },
    };
    if (q.trim()) {
        where[sequelize_1.Op.or] = [
            { firstName: { [sequelize_1.Op.iLike]: `%${q}%` } },
            { lastName: { [sequelize_1.Op.iLike]: `%${q}%` } },
            { email: { [sequelize_1.Op.iLike]: `%${q}%` } },
        ];
    }
    const users = await User_model_1.User.findAll({
        where,
        attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'],
        limit,
        order: [['firstName', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, users);
}));
router.get('/users/online', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    let onlineIds = [];
    if (io) {
        const { onlineUsers } = await Promise.resolve().then(() => __importStar(require('../socket/ChatSocket')));
        onlineIds = Array.from(onlineUsers.entries())
            .filter(([, sockets]) => sockets.size > 0)
            .map(([uid]) => uid);
    }
    ResponseFormatter_1.ResponseFormatter.success(res, { onlineUserIds: onlineIds });
}));
router.get('/conversations', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const participations = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { userId: user.id },
        attributes: ['conversationId', 'role', 'isMuted', 'lastSeenAt'],
    });
    const ids = participations.map((p) => p.conversationId);
    if (ids.length === 0)
        return ResponseFormatter_1.ResponseFormatter.success(res, []);
    const conversations = await Conversation_model_1.Conversation.findAll({
        where: { id: { [sequelize_1.Op.in]: ids } },
        order: [['lastMessageAt', 'DESC'], ['createdAt', 'DESC']],
    });
    const enriched = await Promise.all(conversations.map(async (conv) => {
        const lastMsg = await Message_model_1.Message.findOne({
            where: { conversationId: conv.id },
            include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
            order: [['createdAt', 'DESC']],
        });
        const totalMsgs = await Message_model_1.Message.count({
            where: { conversationId: conv.id, senderUserId: { [sequelize_1.Op.ne]: user.id } },
        }).catch(() => 0);
        const readMsgs = await MessageRead_model_1.MessageRead.count({
            where: { userId: user.id },
            include: [{ model: Message_model_1.Message, where: { conversationId: conv.id }, required: true }],
        }).catch(() => 0);
        const unreadCount = Math.max(0, totalMsgs - readMsgs);
        const myParticipation = participations.find((p) => p.conversationId === conv.id);
        const allParticipants = await ConversationParticipant_model_1.ConversationParticipant.findAll({
            where: { conversationId: conv.id },
            include: [{ model: User_model_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
        });
        const allParticipantsJson = allParticipants.map((p) => p.toJSON());
        return {
            ...conv.toJSON(),
            title: viewerTitle(conv, allParticipantsJson, user.id),
            lastMessage: lastMsg?.toJSON() ?? null,
            unreadCount,
            myRole: myParticipation?.role ?? 'Member',
            isMuted: myParticipation?.isMuted ?? false,
            participants: allParticipantsJson,
        };
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, enriched);
}));
router.post('/conversations', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { title, conversationType, participantUserIds, description, image } = req.body;
    if (!title || !conversationType)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title and conversationType are required', 400);
    const conversation = await Conversation_model_1.Conversation.create({
        uuid: (0, uuid_1.v4)(), conversationCode: `TEMP-${(0, uuid_1.v4)()}`, title, conversationType,
        createdById: user.id, isArchived: false,
    });
    await conversation.update({ conversationCode: `CONV-${String(conversation.id).padStart(6, '0')}` });
    const allParticipants = [...new Set([user.id, ...(participantUserIds || [])])];
    await Promise.all(allParticipants.map((uid, idx) => ConversationParticipant_model_1.ConversationParticipant.create({
        uuid: (0, uuid_1.v4)(),
        conversationId: conversation.id,
        userId: uid,
        role: idx === 0 ? 'Admin' : 'Member',
        joinedAt: new Date(),
        isMuted: false,
    })));
    const io = req.app?.get('io');
    if (io) {
        for (const uid of allParticipants) {
            (0, ChatSocket_1.emitToUser)(io, uid, 'chat:join', { conversationId: conversation.id });
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, conversation, 'Conversation created', 201);
}));
router.post('/conversations/find-or-create', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { userId: otherUserId } = req.body;
    if (!otherUserId)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'userId is required', 400);
    const myConvIds = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { userId: user.id },
        attributes: ['conversationId'],
    });
    const myIds = myConvIds.map((p) => p.conversationId);
    const otherConvIds = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { userId: otherUserId },
        attributes: ['conversationId'],
    });
    const otherIds = otherConvIds.map((p) => p.conversationId);
    const sharedIds = myIds.filter((id) => otherIds.some((oid) => String(oid) === String(id)));
    if (sharedIds.length > 0) {
        const existing = await Conversation_model_1.Conversation.findOne({
            where: { id: { [sequelize_1.Op.in]: sharedIds }, conversationType: 'Direct' },
        });
        if (existing) {
            const participants = await ConversationParticipant_model_1.ConversationParticipant.findAll({
                where: { conversationId: existing.id },
                include: [{ model: User_model_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
            });
            const participantsJson = participants.map((p) => p.toJSON());
            return ResponseFormatter_1.ResponseFormatter.success(res, {
                ...existing.toJSON(),
                title: viewerTitle(existing.toJSON(), participantsJson, user.id),
                participants: participantsJson,
                isNew: false,
            });
        }
    }
    const otherUser = await User_model_1.User.findByPk(otherUserId, { attributes: ['id', 'firstName', 'lastName'] });
    if (!otherUser)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'User not found', 404);
    const title = `${otherUser.firstName} ${otherUser.lastName}`;
    const conversation = await Conversation_model_1.Conversation.create({
        uuid: (0, uuid_1.v4)(), conversationCode: `TEMP-${(0, uuid_1.v4)()}`, title, conversationType: 'Direct',
        createdById: user.id, isArchived: false,
    });
    await conversation.update({ conversationCode: `CONV-${String(conversation.id).padStart(6, '0')}` });
    await Promise.all([user.id, otherUserId].map((uid, idx) => ConversationParticipant_model_1.ConversationParticipant.create({
        uuid: (0, uuid_1.v4)(),
        conversationId: conversation.id,
        userId: uid,
        role: idx === 0 ? 'Admin' : 'Member',
        joinedAt: new Date(),
        isMuted: false,
    })));
    const participants = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { conversationId: conversation.id },
        include: [{ model: User_model_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }],
    });
    const io = req.app?.get('io');
    if (io) {
        (0, ChatSocket_1.emitToUser)(io, user.id, 'chat:join', { conversationId: conversation.id });
        (0, ChatSocket_1.emitToUser)(io, otherUserId, 'chat:join', { conversationId: conversation.id });
    }
    const newParticipantsJson = participants.map((p) => p.toJSON());
    ResponseFormatter_1.ResponseFormatter.success(res, {
        ...conversation.toJSON(),
        title: viewerTitle(conversation.toJSON(), newParticipantsJson, user.id),
        participants: newParticipantsJson,
        isNew: true,
    }, 'Direct message created', 201);
}));
router.get('/conversations/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) },
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
        include: [{ model: User_model_1.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }],
    });
    const participantsJson = participants.map((p) => p.toJSON());
    ResponseFormatter_1.ResponseFormatter.success(res, {
        ...conversation.toJSON(),
        title: viewerTitle(conversation.toJSON(), participantsJson, user.id),
        participants: participantsJson,
    });
}));
router.patch('/conversations/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    if (conversation.conversationType === 'Direct') {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Direct conversations cannot be renamed', 400);
    }
    const isParticipant = await ConversationParticipant_model_1.ConversationParticipant.findOne({
        where: { conversationId: conversation.id, userId: user.id },
    });
    if (!isParticipant)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Access denied', 403);
    const { title } = req.body;
    if (!title || !title.trim())
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title is required', 400);
    await conversation.update({ title: title.trim() });
    const io = req.app?.get('io');
    if (io) {
        io.to(`conv:${conversation.id}`).emit('chat:group_updated', { conversationId: conversation.id, title: title.trim() });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, conversation, 'Group updated');
}));
router.patch('/conversations/:id/archive', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    await conversation.update({ isArchived: !conversation.isArchived });
    ResponseFormatter_1.ResponseFormatter.success(res, conversation, 'Archive status toggled');
}));
router.patch('/conversations/:id/mute', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const participant = await ConversationParticipant_model_1.ConversationParticipant.findOne({
        where: { conversationId: conversation.id, userId: user.id },
    });
    if (!participant)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Not a participant', 403);
    await participant.update({ isMuted: !participant.isMuted });
    ResponseFormatter_1.ResponseFormatter.success(res, participant, 'Mute status toggled');
}));
router.delete('/conversations/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    await ConversationParticipant_model_1.ConversationParticipant.destroy({
        where: { conversationId: conversation.id, userId: user.id },
    });
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Left conversation');
}));
router.post('/conversations/:id/participants', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds))
        return ResponseFormatter_1.ResponseFormatter.error(res, 'userIds array required', 400);
    await Promise.all(userIds.map((uid) => ConversationParticipant_model_1.ConversationParticipant.findOrCreate({
        where: { conversationId: conversation.id, userId: uid },
        defaults: {
            uuid: (0, uuid_1.v4)(),
            conversationId: conversation.id,
            userId: uid,
            role: 'Member',
            joinedAt: new Date(),
            isMuted: false,
        },
    })));
    const io = req.app?.get('io');
    if (io) {
        for (const uid of userIds) {
            (0, ChatSocket_1.emitToUser)(io, uid, 'chat:join', { conversationId: conversation.id });
        }
    }
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Participants added');
}));
router.delete('/conversations/:id/participants/:userId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    await ConversationParticipant_model_1.ConversationParticipant.destroy({
        where: { conversationId: conversation.id, userId: req.params.userId },
    });
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Participant removed');
}));
router.get('/conversations/:id/messages', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { page = 1, limit = 50, before } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const isParticipant = await ConversationParticipant_model_1.ConversationParticipant.findOne({
        where: { conversationId: conversation.id, userId: user.id },
    });
    if (!isParticipant)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Access denied', 403);
    const whereClause = { conversationId: conversation.id };
    if (before)
        whereClause.createdAt = { [sequelize_1.Op.lt]: new Date(before) };
    const { count, rows } = await Message_model_1.Message.findAndCountAll({
        where: whereClause,
        include: [
            { model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            {
                model: Message_model_1.Message, as: 'replyTo',
                include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
                required: false,
            },
        ],
        order: [['createdAt', 'DESC']],
        limit: Number(limit), offset,
    });
    const visible = rows.filter((m) => !(m.deletedForUserIds || []).includes(user.id));
    ResponseFormatter_1.ResponseFormatter.paginated(res, visible.reverse(), count, Number(page), Number(limit));
}));
router.post('/conversations/:id/messages', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const { messageText, messageType, replyToMessageId, attachmentUrl, attachmentType, attachmentName, attachmentSize, attachmentDuration } = req.body;
    if (!messageText)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'messageText is required', 400);
    const message = await Message_model_1.Message.create({
        uuid: (0, uuid_1.v4)(), conversationId: conversation.id, senderUserId: user.id,
        messageText, messageType: (0, messageTypes_1.sanitizeMessageType)(messageType, !!attachmentUrl),
        replyToMessageId, attachmentUrl, attachmentType, attachmentName, attachmentSize, attachmentDuration,
        isEdited: false, isPinned: false, reactions: {}, starredByUserIds: [],
    });
    await conversation.update({ lastMessageAt: new Date() });
    const full = await Message_model_1.Message.findByPk(message.id, {
        include: [
            { model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            {
                model: Message_model_1.Message, as: 'replyTo',
                include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
                required: false,
            },
        ],
    });
    const io = req.app?.get('io');
    if (io) {
        io.to(`conv:${conversation.id}`).emit('chat:message', full?.toJSON());
    }
    const senderInfo = full?.sender;
    const senderName = senderInfo ? `${senderInfo.firstName || ''} ${senderInfo.lastName || ''}`.trim() : user.email;
    (0, mentions_1.detectAndNotifyMentions)({
        messageText, conversationId: conversation.id, messageId: message.id,
        senderUserId: user.id, senderName, io,
    }).catch(() => { });
    ResponseFormatter_1.ResponseFormatter.success(res, full, 'Message sent', 201);
}));
router.patch('/conversations/:convId/messages/:msgId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const message = await Message_model_1.Message.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.msgId) },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    if (String(message.senderUserId) !== String(user.id))
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Can only edit your own messages', 403);
    const { messageText } = req.body;
    if (!messageText)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'messageText is required', 400);
    await message.update({ messageText, isEdited: true, editedAt: new Date() });
    const io = req.app?.get('io');
    if (io) {
        const convId = message.conversationId;
        io.to(`conv:${convId}`).emit('chat:edited', {
            messageId: message.id,
            messageText,
            editedAt: new Date().toISOString(),
        });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, message, 'Message edited');
}));
router.delete('/conversations/:convId/messages/:msgId', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { everyone } = req.query;
    const message = await Message_model_1.Message.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.msgId) },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    const io = req.app?.get('io');
    const convId = message.conversationId;
    if (everyone === 'true') {
        if (String(message.senderUserId) !== String(user.id))
            return ResponseFormatter_1.ResponseFormatter.error(res, 'Can only delete your own messages for everyone', 403);
        await message.update({ messageText: '🚫 This message was deleted', messageType: 'Text', attachmentUrl: null });
        if (io)
            io.to(`conv:${convId}`).emit('chat:deleted', { messageId: message.id, deleteForEveryone: true });
    }
    else {
        const existing = message.deletedForUserIds || [];
        if (!existing.includes(user.id)) {
            await message.update({ deletedForUserIds: [...existing, user.id] });
        }
        if (io)
            (0, ChatSocket_1.emitToUser)(io, user.id, 'chat:deleted', { messageId: message.id, deleteForEveryone: false });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Message deleted');
}));
router.patch('/conversations/:convId/messages/:msgId/pin', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const message = await Message_model_1.Message.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.msgId) },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    const newPinned = !message.isPinned;
    await message.update({ isPinned: newPinned });
    const io = req.app?.get('io');
    if (io) {
        const convId = message.conversationId;
        io.to(`conv:${convId}`).emit('chat:pinned', { messageId: message.id, isPinned: newPinned });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, message, 'Pin status toggled');
}));
router.patch('/conversations/:convId/messages/:msgId/star', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const message = await Message_model_1.Message.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.msgId) },
    });
    if (!message)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    const existing = message.starredByUserIds || [];
    const isStarred = existing.includes(user.id);
    const updated = isStarred ? existing.filter((id) => id !== user.id) : [...existing, user.id];
    await message.update({ starredByUserIds: updated });
    ResponseFormatter_1.ResponseFormatter.success(res, { messageId: message.id, isStarred: !isStarred }, 'Star status toggled');
}));
router.get('/starred', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const participations = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { userId: user.id },
        attributes: ['conversationId'],
    });
    const convIds = participations.map((p) => p.conversationId);
    const starred = await Message_model_1.Message.findAll({
        where: {
            conversationId: { [sequelize_1.Op.in]: convIds },
            starredByUserIds: { [sequelize_1.Op.contains]: [user.id] },
        },
        include: [
            { model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            { model: Conversation_model_1.Conversation, as: 'conversation', attributes: ['id', 'title', 'conversationType'] },
        ],
        order: [['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, starred);
}));
router.patch('/conversations/:convId/messages/:msgId/react', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { emoji } = req.body;
    if (!emoji)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'emoji is required', 400);
    const message = await Message_model_1.Message.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.msgId) },
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
    const io = req.app?.get('io');
    if (io) {
        const convId = message.conversationId;
        io.to(`conv:${convId}`).emit('chat:reaction', {
            messageId: message.id, reactions, userId: user.id, emoji,
        });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, message, 'Reaction updated');
}));
router.post('/conversations/:convId/messages/:msgId/forward', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { targetConversationIds } = req.body;
    if (!targetConversationIds || !Array.isArray(targetConversationIds)) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'targetConversationIds array required', 400);
    }
    const original = await Message_model_1.Message.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.msgId) },
    });
    if (!original)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Message not found', 404);
    const forwarded = await Promise.all(targetConversationIds.map(async (convId) => {
        const conv = await Conversation_model_1.Conversation.findByPk(convId);
        if (!conv)
            return null;
        const msg = await Message_model_1.Message.create({
            uuid: (0, uuid_1.v4)(), conversationId: convId, senderUserId: user.id,
            messageText: original.messageText,
            messageType: original.messageType,
            attachmentUrl: original.attachmentUrl,
            isEdited: false, isPinned: false, reactions: {},
        });
        await conv.update({ lastMessageAt: new Date() });
        const full = await Message_model_1.Message.findByPk(msg.id, {
            include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        });
        const io = req.app?.get('io');
        if (io)
            io.to(`conv:${convId}`).emit('chat:message', full?.toJSON());
        return full;
    }));
    ResponseFormatter_1.ResponseFormatter.success(res, forwarded.filter(Boolean), 'Message forwarded', 201);
}));
router.post('/conversations/:convId/read', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const conversation = await Conversation_model_1.Conversation.findOne({
        where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.convId) },
    });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const conversationId = conversation.id;
    const messages = await Message_model_1.Message.findAll({
        where: { conversationId, senderUserId: { [sequelize_1.Op.ne]: user.id } },
        attributes: ['id', 'senderUserId'],
    });
    await Promise.all(messages.map((msg) => MessageRead_model_1.MessageRead.findOrCreate({
        where: { messageId: msg.id, userId: user.id },
        defaults: { messageId: msg.id, userId: user.id, readAt: new Date() },
    })));
    await ConversationParticipant_model_1.ConversationParticipant.update({ lastSeenAt: new Date() }, { where: { conversationId, userId: user.id } });
    const io = req.app?.get('io');
    if (io) {
        io.to(`conv:${conversationId}`).emit('chat:read_receipt', { conversationId, readBy: user.id, readAt: new Date().toISOString() });
    }
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Marked as read');
}));
router.get('/conversations/:id/pinned', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const pinned = await Message_model_1.Message.findAll({
        where: { conversationId: conversation.id, isPinned: true },
        include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        order: [['createdAt', 'DESC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, pinned);
}));
router.get('/conversations/:id/media', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { type } = req.query;
    const conversation = await Conversation_model_1.Conversation.findOne({ where: { ...(0, idOrUuid_1.idOrUuidWhere)(req.params.id) } });
    if (!conversation)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'Conversation not found', 404);
    const typeFilter = {};
    if (type === 'images')
        typeFilter.messageType = 'Image';
    else if (type === 'files')
        typeFilter.messageType = 'File';
    else
        typeFilter.messageType = { [sequelize_1.Op.in]: ['Image', 'File'] };
    const media = await Message_model_1.Message.findAll({
        where: { conversationId: conversation.id, ...typeFilter, attachmentUrl: { [sequelize_1.Op.ne]: null } },
        include: [{ model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
        order: [['createdAt', 'DESC']],
        limit: 100,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, media);
}));
router.get('/search', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const q = req.query.q || '';
    if (!q.trim())
        return ResponseFormatter_1.ResponseFormatter.success(res, []);
    const participations = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { userId: user.id },
        attributes: ['conversationId'],
    });
    const convIds = participations.map((p) => p.conversationId);
    const messages = await Message_model_1.Message.findAll({
        where: {
            conversationId: { [sequelize_1.Op.in]: convIds },
            messageText: { [sequelize_1.Op.iLike]: `%${q}%` },
        },
        include: [
            { model: User_model_1.User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            { model: Conversation_model_1.Conversation, as: 'conversation', attributes: ['id', 'title', 'conversationType'] },
        ],
        order: [['createdAt', 'DESC']],
        limit: 30,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, messages);
}));
router.get('/calls', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const calls = await Call_model_1.Call.findAll({
        where: {
            [sequelize_1.Op.or]: [{ callerUserId: user.id }, { calleeUserId: user.id }],
        },
        include: [
            { model: User_model_1.User, as: 'caller', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
            { model: User_model_1.User, as: 'callee', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        ],
        order: [['createdAt', 'DESC']],
        limit,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, calls);
}));
exports.default = router;
//# sourceMappingURL=message.routes.js.map