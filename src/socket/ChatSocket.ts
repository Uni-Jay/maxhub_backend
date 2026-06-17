import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { Conversation } from '@models/Conversation.model';
import { ConversationParticipant } from '@models/ConversationParticipant.model';
import { Message } from '@models/Message.model';
import { MessageRead } from '@models/MessageRead.model';
import { Call } from '@models/Call.model';
import { User } from '@models/User.model';

// In-memory presence store: userId → socketId[]
const onlineUsers = new Map<number, Set<string>>();
// socketId → userId
const socketUserMap = new Map<string, number>();
// typing state: conversationId → Set<userId>
const typingUsers = new Map<string, Set<number>>();

function getUserSockets(userId: number): Set<string> {
  return onlineUsers.get(userId) ?? new Set();
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
    } catch {
      // non-fatal
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
          messageType: (data.messageType as any) || 'Text',
          attachmentUrl: data.attachmentUrl,
          attachmentType: data.attachmentType,
          replyToMessageId: data.replyToMessageId,
          isEdited: false,
          isPinned: false,
          reactions: {},
        } as any);

        await conversation.update({ lastMessageAt: new Date() });

        // Fetch with sender info
        const full = await Message.findByPk((message as any).id, {
          include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName', 'avatar'] }],
        });

        const payload = { ...(full?.toJSON() ?? (message as any).toJSON()), tempId: data.tempId };

        // Broadcast to all in conversation room
        io.to(`conv:${data.conversationId}`).emit('chat:message', payload);

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
        if ((msg as any).senderUserId !== userId) return ack?.({ error: 'Forbidden' });

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

        if (data.deleteForEveryone && (msg as any).senderUserId === userId) {
          await msg.update({ messageText: '🚫 This message was deleted', messageType: 'Text', attachmentUrl: null } as any);
          io.to(`conv:${convId}`).emit('chat:deleted', { messageId: data.messageId, deleteForEveryone: true });
        } else {
          // Delete for me only — store in MessageRead with a special marker
          // For simplicity, we just soft-delete
          await msg.destroy();
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
        // Notify senders of read receipt
        const senderIds = [...new Set(messages.map((m: any) => Number(m.senderUserId)))];
        for (const sid of senderIds) {
          const sockets = getUserSockets(sid);
          for (const sockId of sockets) {
            io.to(sockId).emit('chat:read_receipt', { conversationId: data.conversationId, readBy: userId });
          }
        }
        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    // ── Join new conversation room ─────────────────────────────────────────
    socket.on('chat:join', ({ conversationId }: { conversationId: number }) => {
      socket.join(`conv:${conversationId}`);
    });

    // ── WebRTC Call Signaling ──────────────────────────────────────────────
    socket.on('call:initiate', async (data: {
      calleeUserId: number;
      callType: 'Voice' | 'Video';
      conversationId?: number;
      offer: any;
    }, ack) => {
      try {
        const roomName = `call-${uuidv4()}`;
        const call = await Call.create({
          uuid: uuidv4(),
          callerUserId: userId,
          calleeUserId: data.calleeUserId,
          callType: data.callType || 'Voice',
          status: 'Ringing',
          roomName,
          conversationId: data.conversationId,
        } as any);

        const callId = (call as any).id;
        const callerUser = await User.findByPk(userId, { attributes: ['id', 'firstName', 'lastName', 'avatar'] });

        // Notify callee on all their sockets
        const calleeSockets = getUserSockets(data.calleeUserId);
        for (const sockId of calleeSockets) {
          io.to(sockId).emit('call:incoming', {
            callId, callType: data.callType, roomName,
            callerId: userId,
            caller: callerUser?.toJSON(),
            conversationId: data.conversationId,
            offer: data.offer,
          });
        }

        ack?.({ success: true, callId, roomName });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    socket.on('call:answer', async (data: { callId: number; answer: any }, ack) => {
      try {
        const call = await Call.findByPk(data.callId);
        if (!call) return ack?.({ error: 'Call not found' });

        await call.update({ status: 'Active', startedAt: new Date() } as any);

        const callerSockets = getUserSockets(Number((call as any).callerUserId));
        for (const sockId of callerSockets) {
          io.to(sockId).emit('call:accepted', { callId: data.callId, answer: data.answer });
        }
        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    socket.on('call:reject', async (data: { callId: number }, ack) => {
      try {
        const call = await Call.findByPk(data.callId);
        if (!call) return ack?.({ error: 'Call not found' });

        await call.update({ status: 'Declined', endedAt: new Date() } as any);

        const callerSockets = getUserSockets(Number((call as any).callerUserId));
        for (const sockId of callerSockets) {
          io.to(sockId).emit('call:rejected', { callId: data.callId, rejectedBy: userId });
        }
        ack?.({ success: true });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    socket.on('call:end', async (data: { callId: number }, ack) => {
      try {
        const call = await Call.findByPk(data.callId);
        if (!call) return ack?.({ error: 'Call not found' });

        const now = new Date();
        const started = (call as any).startedAt ? new Date((call as any).startedAt) : now;
        const duration = Math.floor((now.getTime() - started.getTime()) / 1000);

        await call.update({ status: 'Ended', endedAt: now, durationSeconds: duration } as any);

        const otherUserId = (call as any).callerUserId === userId
          ? Number((call as any).calleeUserId)
          : Number((call as any).callerUserId);

        const otherSockets = getUserSockets(otherUserId);
        for (const sockId of otherSockets) {
          io.to(sockId).emit('call:ended', { callId: data.callId, duration, endedBy: userId });
        }
        ack?.({ success: true, duration });
      } catch (err: any) {
        ack?.({ error: err.message });
      }
    });

    // ICE candidate relay
    socket.on('call:ice_candidate', (data: { targetUserId: number; candidate: any; callId: number }) => {
      const targetSockets = getUserSockets(data.targetUserId);
      for (const sockId of targetSockets) {
        io.to(sockId).emit('call:ice_candidate', { from: userId, candidate: data.candidate, callId: data.callId });
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
