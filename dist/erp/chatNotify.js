"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyChatMessage = notifyChatMessage;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
const push_1 = require("./push");
async function notifyChatMessage(io, msg, conversationId, senderUserId) {
    try {
        const rows = await Database_1.default.query(`SELECT cp."userId", c.title, c."conversationType"
       FROM conversation_participants cp JOIN conversations c ON c.id = cp."conversationId"
       WHERE cp."conversationId" = :c AND cp."deletedAt" IS NULL AND cp."userId" <> :s AND COALESCE(cp."isMuted", false) = false`, { replacements: { c: conversationId, s: senderUserId }, type: sequelize_1.QueryTypes.SELECT });
        if (!rows.length)
            return;
        const sender = msg?.sender ? `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() : 'New message';
        const isGroup = rows[0].conversationType !== 'Direct';
        const preview = msg?.messageText && msg.messageType === 'Text' ? String(msg.messageText) : msg?.messageType === 'Image' ? '📷 Photo' : msg?.messageType === 'Voice' || msg?.messageType === 'Audio' ? '🎤 Voice note' : msg?.attachmentName ? `📎 ${msg.attachmentName}` : msg?.messageText || 'New message';
        const payload = {
            conversationId, messageId: msg?.id, sender, preview,
            title: isGroup ? `${sender} · ${rows[0].title}` : sender,
        };
        const { emitToUser } = require('../socket/ChatSocket');
        for (const r of rows) {
            emitToUser(io, Number(r.userId), 'chat:notify', payload);
            emitToUser(io, Number(r.userId), 'chat:join', { conversationId });
        }
        (0, push_1.pushToUsers)(rows.map((r) => Number(r.userId)), {
            title: payload.title, body: preview, url: `/messages?c=${conversationId}`, tag: `chat-${conversationId}`,
        });
    }
    catch (e) {
        console.error('[chat notify]', e.message);
    }
}
//# sourceMappingURL=chatNotify.js.map