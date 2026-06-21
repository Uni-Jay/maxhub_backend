import { ConversationParticipant } from '@models/ConversationParticipant.model';
import { User } from '@models/User.model';
import { notifyUser } from './notify';

/**
 * Scans message text for @FirstName mentions, matches them against the
 * conversation's actual participants (case-insensitive, first name only —
 * good enough for a chat app's @-mention, not a full user-search picker),
 * and notifies each matched user (except the sender). Silently no-ops if
 * nobody is mentioned — this is meant to be fired-and-forgotten after a
 * message send, never block or fail the send itself.
 */
export async function detectAndNotifyMentions(params: {
  messageText: string;
  conversationId: bigint | number | string;
  messageId: bigint | number | string;
  senderUserId: bigint | number | string;
  senderName: string;
  io?: any;
}): Promise<void> {
  const { messageText, conversationId, messageId, senderUserId, senderName, io } = params;
  const mentionPattern = /@(\w+)/g;
  const mentioned = new Set<string>();
  let match;
  while ((match = mentionPattern.exec(messageText)) !== null) {
    mentioned.add(match[1].toLowerCase());
  }
  if (mentioned.size === 0) return;

  const participants = await ConversationParticipant.findAll({
    where: { conversationId },
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName'] }],
  });

  const preview = messageText.length > 80 ? `${messageText.slice(0, 80)}...` : messageText;

  for (const p of participants) {
    const u = (p as any).user;
    if (!u || String(u.id) === String(senderUserId)) continue;
    if (!mentioned.has(String(u.firstName).toLowerCase())) continue;

    await notifyUser(u.id, {
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
