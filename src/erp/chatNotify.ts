import { QueryTypes } from 'sequelize';
import sequelize from '@config/Database';
import { pushToUsers } from './push';

/**
 * Alerts every participant of a conversation (except the sender and anyone
 * who muted it) about a new chat message — in-app via 'chat:notify' on all
 * their open tabs, and as a desktop/phone pop-up via Web Push.
 */
export async function notifyChatMessage(io: any, msg: any, conversationId: number, senderUserId: number): Promise<void> {
  try {
    const rows: any[] = await sequelize.query(
      `SELECT cp."userId", c.title, c."conversationType"
       FROM conversation_participants cp JOIN conversations c ON c.id = cp."conversationId"
       WHERE cp."conversationId" = :c AND cp."deletedAt" IS NULL AND cp."userId" <> :s AND COALESCE(cp."isMuted", false) = false`,
      { replacements: { c: conversationId, s: senderUserId }, type: QueryTypes.SELECT },
    );
    if (!rows.length) return;
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
      // Make sure their sockets are in the room even for a brand-new chat.
      emitToUser(io, Number(r.userId), 'chat:join', { conversationId });
    }
    pushToUsers(rows.map((r) => Number(r.userId)), {
      title: payload.title, body: preview, url: `/messages?c=${conversationId}`, tag: `chat-${conversationId}`,
    });
  } catch (e: any) {
    console.error('[chat notify]', e.message);
  }
}
