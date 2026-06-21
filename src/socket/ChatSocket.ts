import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { Conversation } from '@models/Conversation.model';
import { ConversationParticipant } from '@models/ConversationParticipant.model';
import { Message } from '@models/Message.model';
import { MessageRead } from '@models/MessageRead.model';
import { User } from '@models/User.model';
import { detectAndNotifyMentions } from '@utils/mentions';
import { sanitizeMessageType } from '@utils/messageTypes';

// In-memory presence store: userId → socketId[]
const onlineUsers = new Map<number, Set<string>>();
// socketId → userId
const socketUserMap = new Map<string, number>();
// typing state: conversationId → Set<userId>
const typingUsers = new Map<string, Set<number>>();

function getUserSockets(userId: number): Set<string> {
  return onlineUsers.get(userId) ?? new Set();
}

/**
 * Emits an event to every socket a specific user currently has open, by
 * iterating their actual connected socket IDs — not a "user:{id}" room,
 * since no socket here ever joins one. (message.routes.ts previously used
 * `io.to('user:${uid}')`, which targeted a room nobody was in and silently
 * reached no one; this is the fix, reusing the same mechanism the read-
 * receipt handler below already relies on.)
 */
export function emitToUser(io: SocketServer, userId: number, event: string, payload: any) {
  for (const sockId of getUserSockets(userId)) {
    io.to(sockId).emit(event, payload);
  }
}

function broadcastPresence(io: SocketServer, userId: number, isOnline: boolean) {
  io.emit('user:presence', { userId, isOnline, lastSeen: new Date().toISOString() });
}

export function initChatSocket(httpServer: HttpServer): SocketServer {
  const allowedOrigins = (
    process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://localhost:3000'
  ).split(',');

  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin) || origin.includes('onrender.com') || origin.includes('vercel.app') || origin.includes('netlify.app')) {
          cb(null, true);
        } else {
          cb(null, true); // permissive for ERP — tighten per environment
        }
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Authentication middleware ──────────────────────────────────────────────
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));

      const secret = process.env.JWT_SECRET || 'fallback_secret';
      const payload = jwt.verify(token, secret) as any;
      (socket as any).userId = Number(payload.id || payload.userId);
      (socket as any).userEmail = payload.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = (socket as any).userId as number;

    // Register presence
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId)!.add(socket.id);
    socketUserMap.set(socket.id, userId);
    broadcastPresence(io, userId, true);

    // Join all conversation rooms this user participates in
    try {
      const participations = await ConversationParticipant.findAll({
        where: { userId },
        attributes: ['conversationId'],
      });
      for (const p of participations) {
        socket.join(`conv:${(p as any).conversationId}`);
      }
    } catch (err) {
      // A failure here leaves this socket subscribed to zero conversation
      // rooms with no retry — it would receive presence/typing events but
      // never a single chat:message until the client reconnects. Logging
      // so this isn't invisible; not rethrowing since presence should
      // still work.
      console.error(`[ChatSocket] Failed to join conversation rooms for user ${userId}:`, err);
    }

    // Send current online users list to newly connected user
    const onlineList = Array.from(onlineUsers.entries())
      .filter(([, sockets]) => sockets.size > 0)
      .map(([uid]) => uid);
    socket.emit('user:online_list', onlineList);

    // ── Typing events ──────────────────────────────────────────────────────
    socket.on('chat:typing_start', ({ conversationId }: { conversationId: number }) => {
      const key = String(conversationId);
      if (!typingUsers.has(key)) typingUsers.set(key, new Set());
      typingUsers.get(key)!.add(userId);
      socket.to(`conv:${conversationId}`).emit('chat:typing', { conversationId, userId });
    });

    socket.on('chat:typing_stop', ({ conversationId }: { conversationId: number }) => {
      const key = String(conversationId);
      typingUsers.get(key)?.delete(userId);
      socket.to(`conv:${conversationId}`).emit('chat:stop_typing', { conversationId, userId });
    });

    // ── Send message ───────────────────────────────────────────────────────
    socket.on('chat:send', async (data: {
      conversationId: number;
      messageText: string;
      messageType?: string;
      attachmentUrl?: string;
      attachmentType?: string;
      attachmentName?: string;
      attachmentSize?: number;
      attachmentDuration?: number;
      replyToMessageId?: number;
      tempId?: string;
    }, ack) => {
      try {
        const conversation = await Conversation.findByPk(data.conversationId);
        if (!conversation) return ack?.({ error: 'Conversation not found' });

        const isParticipant = await ConversationParticipant.findOne({
          where: { conversationId: data.conversationId, userId },
        });
        if (!isParticipant) return ack?.({ error: 'Not a participant' });

        const message = await Message.create({
          uuid: uuidv4(),
          conversationId: data.conversationId,
          senderUserId: userId,
          messageText: data.messageText || '',
          messageType: sanitizeMessageType(data.messageType, !!data.attachmentUrl),
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
        } as any);

        await conversation.update({ lastMessageAt: new Date() });

        // Fetch with sender info
        const full = await Message.findByPk((message as any).id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        });

        const payload = { ...(full?.toJSON() ?? (message as any).toJSON()), tempId: data.tempId };

        // Broadcast to all in conversation room
        io.to(`conv:${data.conversationId}`).emit('chat:message', payload);

        const senderInfo = (full as any)?.sender;
        const senderName = senderInfo ? `${senderInfo.firstName || ''} ${senderInfo.lastName || ''}`.trim() : 'Someone';
        detectAndNotifyMentions({
          messageText: data.messageText || '', conversationId: data.conversationId, messageId: (message as any).id,
          senderUserId: userId, senderName, io,
        }).catch(() => {});

        ack?.({ success: true, message: payload });
      } catch (err: any) {
        ack?.({ error: err.message || 'Send failed' });
      }
    });

    // ── Edit message ───────────────────────────────────────────────────────
    socket.on('chat:edit', async (data: { messageId: number; messageText: string }, ack) => {
      try {
        const msg = await Message.findByPk(data.messageId);
        if (!msg) return ack?.({ error: 'Message not found' });
        // senderUserId is BIGINT — pg returns it as a string — while userId
        // here is a number, so a strict !== was always true and editing your
        // own message always came back "Forbidden".
        if (String((msg as any).senderUserId) !== String(userId)) return ack?.({ error: 'Forbidden' });

        await msg.update({ messageText: data.messageText, isEdited: true, editedAt: new Date() });
        const convId = (msg as any).conversationId;
        io.to(`conv:${convId}`).emit('chat:edited', { messageId: data.messageId, messageText: data.messageText, editedAt: new Date().toISOString() });
        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    // ── Delete message ─────────────────────────────────────────────────────
    socket.on('chat:delete', async (data: { messageId: number; deleteForEveryone?: boolean }, ack) => {
      try {
        const msg = await Message.findByPk(data.messageId);
        if (!msg) return ack?.({ error: 'Message not found' });
        const convId = (msg as any).conversationId;

        if (data.deleteForEveryone) {
          // Same BIGINT-string vs number mismatch as chat:edit above.
          if (String((msg as any).senderUserId) !== String(userId)) return ack?.({ error: 'Can only delete your own messages for everyone' });
          await msg.update({ messageText: '🚫 This message was deleted', messageType: 'Text', attachmentUrl: null } as any);
          io.to(`conv:${convId}`).emit('chat:deleted', { messageId: data.messageId, deleteForEveryone: true });
        } else {
          // Delete for me only — hides it from just this user's view via
          // deletedForUserIds, without touching the row anyone else sees.
          // This used to call msg.destroy(), a soft delete that removed the
          // message for every participant, not just the requester.
          const existing: number[] = (msg as any).deletedForUserIds || [];
          if (!existing.includes(userId)) {
            await msg.update({ deletedForUserIds: [...existing, userId] } as any);
          }
          socket.emit('chat:deleted', { messageId: data.messageId, deleteForEveryone: false });
        }
        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    // ── React ──────────────────────────────────────────────────────────────
    socket.on('chat:react', async (data: { messageId: number; emoji: string }, ack) => {
      try {
        const msg = await Message.findByPk(data.messageId);
        if (!msg) return ack?.({ error: 'Message not found' });

        const reactions: Record<string, number[]> = ((msg as any).reactions as any) || {};
        const users: number[] = reactions[data.emoji] || [];

        if (users.includes(userId)) {
          reactions[data.emoji] = users.filter(id => id !== userId);
          if (reactions[data.emoji].length === 0) delete reactions[data.emoji];
        } else {
          reactions[data.emoji] = [...users, userId];
        }

        await msg.update({ reactions: { ...reactions } as any });
        const convId = (msg as any).conversationId;
        io.to(`conv:${convId}`).emit('chat:reaction', { messageId: data.messageId, reactions, userId, emoji: data.emoji });
        ack?.({ success: true, reactions });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    // ── Pin message ────────────────────────────────────────────────────────
    socket.on('chat:pin', async (data: { messageId: number }, ack) => {
      try {
        const msg = await Message.findByPk(data.messageId);
        if (!msg) return ack?.({ error: 'Message not found' });
        const newPinned = !(msg as any).isPinned;
        await msg.update({ isPinned: newPinned });
        const convId = (msg as any).conversationId;
        io.to(`conv:${convId}`).emit('chat:pinned', { messageId: data.messageId, isPinned: newPinned });
        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    // ── Mark read ──────────────────────────────────────────────────────────
    socket.on('chat:read', async (data: { conversationId: number }, ack) => {
      try {
        const messages = await Message.findAll({
          where: { conversationId: data.conversationId, senderUserId: { [Op.ne]: userId } },
          attributes: ['id'],
        });
        await Promise.all(messages.map((m: any) =>
          MessageRead.findOrCreate({
            where: { messageId: m.id, userId },
            defaults: { messageId: m.id, userId, readAt: new Date() } as any,
          })
        ));
        // Drives the Seen tick on the other participant's client — see the
        // matching REST /read route for the full explanation.
        await ConversationParticipant.update(
          { lastSeenAt: new Date() },
          { where: { conversationId: data.conversationId, userId } }
        );
        // Notify senders of read receipt
        const senderIds = [...new Set(messages.map((m: any) => Number(m.senderUserId)))];
        for (const sid of senderIds) {
          const sockets = getUserSockets(sid);
          for (const sockId of sockets) {
            io.to(sockId).emit('chat:read_receipt', { conversationId: data.conversationId, readBy: userId, readAt: new Date().toISOString() });
          }
        }
        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    // ── Join new conversation room ─────────────────────────────────────────
    // Verifies the requesting socket's user is actually a participant before
    // joining — previously unconditional, so a broadcast chat:join (or any
    // client just emitting one with an arbitrary id) could subscribe a
    // socket to a conversation room it has no business reading.
    socket.on('chat:join', async ({ conversationId }: { conversationId: number }) => {
      try {
        const isParticipant = await ConversationParticipant.findOne({
          where: { conversationId, userId },
        });
        if (isParticipant) socket.join(`conv:${conversationId}`);
      } catch {
        // non-fatal — worst case the client doesn't get live updates for this room
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
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

export { onlineUsers };
