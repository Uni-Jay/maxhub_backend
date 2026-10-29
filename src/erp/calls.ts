import { Server as SocketServer, Socket } from 'socket.io';
import { QueryTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '@config/Database';

/**
 * In-app voice & video calls (1-to-1 and small group calls, mesh WebRTC).
 * The server only relays signaling (SDP offers/answers, ICE candidates) and
 * keeps the ringing/joined state; media flows browser-to-browser. For
 * reliable calls across mobile networks set TURN_URL / TURN_USERNAME /
 * TURN_CREDENTIAL (see /api/erp/calls/ice).
 */

interface LiveCall {
  id: string;
  callerId: number;
  callType: 'Voice' | 'Video';
  conversationId: number | null;
  title: string;
  invited: Set<number>;
  joined: Map<number, string>; // userId → socketId that joined
  startedAt: Date;
  answeredAt: Date | null;
  ringTimer?: NodeJS.Timeout;
}

const calls = new Map<string, LiveCall>();
const MAX_PARTICIPANTS = 8;
const RING_MS = 45_000;

async function nameOf(uid: number): Promise<string> {
  const r: any[] = await sequelize.query(`SELECT "firstName", "lastName", email FROM users WHERE id = :id`, { replacements: { id: uid }, type: QueryTypes.SELECT });
  return r[0] ? `${r[0].firstName || ''} ${r[0].lastName || ''}`.trim() || r[0].email : `User ${uid}`;
}

async function logCall(c: LiveCall, calleeId: number, status: string, endedAt?: Date) {
  try {
    const dur = c.answeredAt && endedAt ? Math.round((endedAt.getTime() - c.answeredAt.getTime()) / 1000) : null;
    const up: any[] = await sequelize.query(
      `UPDATE calls SET status = :status, "endedAt" = COALESCE(:endedAt, "endedAt"), "startedAt" = COALESCE("startedAt", :answeredAt), "durationSeconds" = COALESCE(:dur, "durationSeconds"), "updatedAt" = NOW()
       WHERE "roomName" = :room AND "calleeUserId" = :callee RETURNING id`,
      { replacements: { status, endedAt: endedAt || null, answeredAt: c.answeredAt, dur, room: c.id, callee: calleeId }, type: QueryTypes.SELECT },
    );
    if (!up[0]) {
      await sequelize.query(
        `INSERT INTO calls (uuid, "callerUserId", "calleeUserId", "callType", status, "roomName", "conversationId", "startedAt", "endedAt", "durationSeconds", "createdAt", "updatedAt")
         VALUES (:uuid, :caller, :callee, :type, :status, :room, :conv, :answeredAt, :endedAt, :dur, NOW(), NOW())`,
        { replacements: { uuid: uuidv4(), caller: c.callerId, callee: calleeId, type: c.callType, status, room: c.id, conv: c.conversationId, answeredAt: c.answeredAt, endedAt: endedAt || null, dur } },
      );
    }
  } catch { /* the calls table is optional */ }
}

async function conversationMembers(conversationId: number, userId: number): Promise<number[] | null> {
  const rows: any[] = await sequelize.query(
    `SELECT "userId" FROM conversation_participants WHERE "conversationId" = :c AND "deletedAt" IS NULL`,
    { replacements: { c: conversationId }, type: QueryTypes.SELECT },
  );
  const ids = rows.map((r) => Number(r.userId));
  return ids.includes(userId) ? ids : null;
}

export function registerCallHandlers(
  io: SocketServer, socket: Socket, userId: number,
  h: { emitToUser: (io: SocketServer, uid: number, ev: string, p: any) => void; getUserSockets: (uid: number) => Set<string> },
) {
  const toCall = (c: LiveCall, ev: string, payload: any, exceptUser?: number) => {
    for (const [uid, sid] of c.joined) if (uid !== exceptUser) io.to(sid).emit(ev, payload);
  };

  const endCall = async (c: LiveCall, reason: string) => {
    if (!calls.has(c.id)) return;
    calls.delete(c.id);
    if (c.ringTimer) clearTimeout(c.ringTimer);
    const now = new Date();
    for (const uid of c.invited) {
      if (uid === c.callerId) continue;
      h.emitToUser(io, uid, 'call:ended', { callId: c.id, reason });
      await logCall(c, uid, c.answeredAt ? 'Ended' : reason === 'declined' ? 'Declined' : 'Missed', now);
    }
    toCall(c, 'call:ended', { callId: c.id, reason });
    h.emitToUser(io, c.callerId, 'call:ended', { callId: c.id, reason });
  };

  const leave = async (callId: string) => {
    const c = calls.get(callId);
    if (!c || !c.joined.has(userId)) return;
    c.joined.delete(userId);
    toCall(c, 'call:participant_left', { callId, userId });
    const ringing = [...c.invited].filter((u) => !c.joined.has(u));
    if (c.joined.size <= 1 && (c.answeredAt || ringing.length === 0 || userId === c.callerId)) await endCall(c, 'ended');
  };

  socket.on('call:start', async (data: { targetUserIds?: number[]; conversationId?: number; callType?: 'Voice' | 'Video' }, ack?: Function) => {
    try {
      let targets = (data.targetUserIds || []).map(Number).filter((u) => u && u !== userId);
      let title = '';
      if (data.conversationId) {
        const members = await conversationMembers(Number(data.conversationId), userId);
        if (!members) return ack?.({ ok: false, error: 'You are not in this conversation' });
        if (!targets.length) targets = members.filter((u) => u !== userId);
        const t: any[] = await sequelize.query(`SELECT title, "conversationType" FROM conversations WHERE id = :id`, { replacements: { id: data.conversationId }, type: QueryTypes.SELECT });
        if (t[0] && t[0].conversationType !== 'Direct') title = t[0].title;
      }
      targets = [...new Set(targets)].slice(0, MAX_PARTICIPANTS - 1);
      if (!targets.length) return ack?.({ ok: false, error: 'Nobody to call' });
      const online = targets.filter((u) => h.getUserSockets(u).size > 0);
      const c: LiveCall = {
        id: uuidv4(), callerId: userId, callType: data.callType === 'Voice' ? 'Voice' : 'Video', conversationId: data.conversationId ? Number(data.conversationId) : null,
        title, invited: new Set([userId, ...targets]), joined: new Map([[userId, socket.id]]), startedAt: new Date(), answeredAt: null,
      };
      calls.set(c.id, c);
      const from = { id: userId, name: await nameOf(userId) };
      for (const t of targets) await logCall(c, t, 'Ringing'); // log first so accept/decline updates this row
      for (const t of targets) h.emitToUser(io, t, 'call:incoming', { callId: c.id, from, callType: c.callType, conversationId: c.conversationId, title, participants: [...c.invited] });
      c.ringTimer = setTimeout(async () => {
        const live = calls.get(c.id);
        if (!live) return;
        const notAnswered = [...live.invited].filter((u) => !live.joined.has(u));
        for (const u of notAnswered) {
          h.emitToUser(io, u, 'call:ended', { callId: c.id, reason: 'missed' });
          await logCall(live, u, 'Missed', new Date());
          try {
            const { notifyUser } = require('@utils/notify');
            await notifyUser(u, { type: 'Message', title: `Missed ${live.callType.toLowerCase()} call`, message: `You missed a call from ${from.name}.`, actionUrl: '/messages', priority: 'Medium' }, io);
          } catch { /* ignore */ }
          live.invited.delete(u);
        }
        if (live.joined.size <= 1) await endCall(live, 'no-answer');
        else toCall(live, 'call:ringing_done', { callId: c.id });
      }, RING_MS);
      ack?.({ ok: true, callId: c.id, offline: targets.filter((t) => !online.includes(t)) });
    } catch (e: any) {
      ack?.({ ok: false, error: e.message });
    }
  });

  socket.on('call:accept', async ({ callId }: { callId: string }, ack?: Function) => {
    const c = calls.get(callId);
    if (!c || !c.invited.has(userId)) return ack?.({ ok: false, error: 'This call has ended' });
    if (c.joined.size >= MAX_PARTICIPANTS) return ack?.({ ok: false, error: 'Call is full' });
    const existing = [...c.joined.keys()];
    c.joined.set(userId, socket.id);
    if (!c.answeredAt) c.answeredAt = new Date();
    await logCall(c, userId, 'Active');
    // Tell my other tabs/devices to stop ringing.
    for (const sid of h.getUserSockets(userId)) if (sid !== socket.id) io.to(sid).emit('call:answered_elsewhere', { callId });
    toCall(c, 'call:participant_joined', { callId, userId, name: await nameOf(userId) }, userId);
    // The newcomer sends offers to everyone already in the call.
    const peers = await Promise.all(existing.map(async (u) => ({ userId: u, name: await nameOf(u) })));
    ack?.({ ok: true, callType: c.callType, peers });
  });

  socket.on('call:decline', async ({ callId }: { callId: string }) => {
    const c = calls.get(callId);
    if (!c || !c.invited.has(userId) || c.joined.has(userId)) return;
    c.invited.delete(userId);
    await logCall(c, userId, 'Declined', new Date());
    for (const sid of h.getUserSockets(userId)) io.to(sid).emit('call:ended', { callId, reason: 'declined' });
    toCall(c, 'call:declined', { callId, userId, name: await nameOf(userId) });
    const ringing = [...c.invited].filter((u) => !c.joined.has(u));
    if (c.joined.size <= 1 && ringing.length === 0) await endCall(c, 'declined');
  });

  socket.on('call:signal', ({ callId, toUserId, data }: { callId: string; toUserId: number; data: any }) => {
    const c = calls.get(callId);
    if (!c || !c.joined.has(userId)) return;
    const sid = c.joined.get(Number(toUserId));
    if (sid) io.to(sid).emit('call:signal', { callId, fromUserId: userId, data });
  });

  socket.on('call:media_state', ({ callId, audio, video }: { callId: string; audio: boolean; video: boolean }) => {
    const c = calls.get(callId);
    if (c && c.joined.has(userId)) toCall(c, 'call:media_state', { callId, userId, audio, video }, userId);
  });

  socket.on('call:invite', async ({ callId, userIds }: { callId: string; userIds: number[] }) => {
    const c = calls.get(callId);
    if (!c || !c.joined.has(userId)) return;
    const from = { id: userId, name: await nameOf(userId) };
    for (const u of (userIds || []).map(Number)) {
      if (c.invited.has(u) || c.invited.size >= MAX_PARTICIPANTS) continue;
      c.invited.add(u);
      await logCall(c, u, 'Ringing');
      h.emitToUser(io, u, 'call:incoming', { callId, from, callType: c.callType, conversationId: c.conversationId, title: c.title, participants: [...c.invited] });
    }
  });

  socket.on('call:leave', ({ callId }: { callId: string }) => { leave(callId); });

  socket.on('disconnect', () => {
    for (const c of calls.values()) if (c.joined.get(userId) === socket.id) leave(c.id);
  });
}
