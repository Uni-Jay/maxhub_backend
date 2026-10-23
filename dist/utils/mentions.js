"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAndNotifyMentions = detectAndNotifyMentions;
const ConversationParticipant_model_1 = require("../models/ConversationParticipant.model");
const User_model_1 = require("../models/User.model");
const notify_1 = require("./notify");
async function detectAndNotifyMentions(params) {
    const { messageText, conversationId, messageId, senderUserId, senderName, io } = params;
    const mentionPattern = /@(\w+)/g;
    const mentioned = new Set();
    let match;
    while ((match = mentionPattern.exec(messageText)) !== null) {
        mentioned.add(match[1].toLowerCase());
    }
    if (mentioned.size === 0)
        return;
    const participants = await ConversationParticipant_model_1.ConversationParticipant.findAll({
        where: { conversationId },
        include: [{ model: User_model_1.User, as: 'user', attributes: ['id', 'firstName'] }],
    });
    const preview = messageText.length > 80 ? `${messageText.slice(0, 80)}...` : messageText;
    for (const p of participants) {
        const u = p.user;
        if (!u || String(u.id) === String(senderUserId))
            continue;
        if (!mentioned.has(String(u.firstName).toLowerCase()))
            continue;
        await (0, notify_1.notifyUser)(u.id, {
            type: 'Mention',
            title: `${senderName} mentioned you`,
            message: preview,
            relatedEntityType: 'Message',
            relatedEntityId: messageId,
            actionUrl: '/messages',
            priority: 'High',
        }, io);
    }
}
//# sourceMappingURL=mentions.js.map