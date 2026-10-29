"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCallHandlers = registerCallHandlers;
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const Database_1 = __importDefault(require("../config/Database"));
const calls = new Map();
const MAX_PARTICIPANTS = 8;
const RING_MS = 45000;
async function nameOf(uid) {
    const r = await Database_1.default.query(`SELECT "firstName", "lastName", email FROM users WHERE id = :id`, { replacements: { id: uid }, type: sequelize_1.QueryTypes.SELECT });
    return r[0] ? `${r[0].firstName || ''} ${r[0].lastName || ''}`.trim() || r[0].email : `User ${uid}`;
}
async function logCall(c, calleeId, status, endedAt) {
    try {
        const dur = c.answeredAt && endedAt ? Math.round((endedAt.getTime() - c.answeredAt.getTime()) / 1000) : null;
        const up = await Database_1.default.query(`UPDATE calls SET status = :status, "endedAt" = COALESCE(:endedAt, "endedAt"), "startedAt" = COALESCE("startedAt", :answeredAt), "durationSeconds" = COALESCE(:dur, "durationSeconds"), "updatedAt" = NOW()
       WHERE "roomName" = :room AND "calleeUserId" = :callee RETURNING id`, { replacements: { status, endedAt: endedAt || null, answeredAt: c.answeredAt, dur, room: c.id, callee: calleeId }, type: sequelize_1.QueryTypes.SELECT });
        if (!up[0]) {
            await Database_1.default.query(`INSERT INTO calls (uuid, "callerUserId", "calleeUserId", "callType", status, "roomName", "conversationId", "startedAt", "endedAt", "durationSeconds", "createdAt", "updatedAt")
         VALUES (:uuid, :caller, :callee, :type, :status, :room, :conv, :answeredAt, :endedAt, :dur, NOW(), NOW())`, { replacements: { uuid: (0, uuid_1.v4)(), caller: c.callerId, callee: calleeId, type: c.callType, status, room: c.id, conv: c.conversationId, answeredAt: c.answeredAt, endedAt: endedAt || null, dur } });
        }
    }
    catch { }
}
async function conversationMembers(conversationId, userId) {
    const rows = await Database_1.default.query(`SELECT "userId" FROM conversation_participants WHERE "conversationId" = :c AND "deletedAt" IS NULL`, { replacements: { c: conversationId }, type: sequelize_1.QueryTypes.SELECT });
    const ids = rows.map((r) => Number(r.userId));
    return ids.includes(userId) ? ids : null;
}
function registerCallHandlers(io, socket, userId, h) {
    const toCall = (c, ev, payload, exceptUser) => {
        for (const [uid, sid] of c.joined)
            if (uid !== exceptUser)
                io.to(sid).emit(ev, payload);
    };
    const endCall = async (c, reason) => {
        if (!calls.has(c.id))
            return;
        calls.delete(c.id);
        if (c.ringTimer)
            clearTimeout(c.ringTimer);
        const now = new Date();
        for (const uid of c.invited) {
            if (uid === c.callerId)
                continue;
            h.emitToUser(io, uid, 'call:ended', { callId: c.id, reason });
            await logCall(c, uid, c.answeredAt ? 'Ended' : reason === 'declined' ? 'Declined' : 'Missed', now);
        }
        toCall(c, 'call:ended', { callId: c.id, reason });
        h.emitToUser(io, c.callerId, 'call:ended', { callId: c.id, reason });
    };
    const leave = async (callId) => {
        const c = calls.get(callId);
        if (!c || !c.joined.has(userId))
            return;
        c.joined.delete(userId);
        toCall(c, 'call:participant_left', { callId, userId });
        const ringing = [...c.invited].filter((u) => !c.joined.has(u));
        if (c.joined.size <= 1 && (c.answeredAt || ringing.length === 0 || userId === c.callerId))
            await endCall(c, 'ended');
    };
    socket.on('call:start', async (data, ack) => {
        try {
            let targets = (data.targetUserIds || []).map(Number).filter((u) => u && u !== userId);
            let title = '';
            if (data.conversationId) {
                const members = await conversationMembers(Number(data.conversationId), userId);
                if (!members)
                    return ack?.({ ok: false, error: 'You are not in this conversation' });
                if (!targets.length)
                    targets = members.filter((u) => u !== userId);
                const t = await Database_1.default.query(`SELECT title, "conversationType" FROM conversations WHERE id = :id`, { replacements: { id: data.conversationId }, type: sequelize_1.QueryTypes.SELECT });
                if (t[0] && t[0].conversationType !== 'Direct')
                    title = t[0].title;
            }
            targets = [...new Set(targets)].slice(0, MAX_PARTICIPANTS - 1);
            if (!targets.length)
                return ack?.({ ok: false, error: 'Nobody to call' });
            const online = targets.filter((u) => h.getUserSockets(u).size > 0);
            const c = {
                id: (0, uuid_1.v4)(), callerId: userId, callType: data.callType === 'Voice' ? 'Voice' : 'Video', conversationId: data.conversationId ? Number(data.conversationId) : null,
                title, invited: new Set([userId, ...targets]), joined: new Map([[userId, socket.id]]), startedAt: new Date(), answeredAt: null,
            };
            calls.set(c.id, c);
            const from = { id: userId, name: await nameOf(userId) };
            for (const t of targets)
                await logCall(c, t, 'Ringing');
            for (const t of targets)
                h.emitToUser(io, t, 'call:incoming', { callId: c.id, from, callType: c.callType, conversationId: c.conversationId, title, participants: [...c.invited] });
            c.ringTimer = setTimeout(async () => {
                const live = calls.get(c.id);
                if (!live)
                    return;
                const notAnswered = [...live.invited].filter((u) => !live.joined.has(u));
                for (const u of notAnswered) {
                    h.emitToUser(io, u, 'call:ended', { callId: c.id, reason: 'missed' });
                    await logCall(live, u, 'Missed', new Date());
                    try {
                        const { notifyUser } = require('../utils/notify');
                        await notifyUser(u, { type: 'Message', title: `Missed ${live.callType.toLowerCase()} call`, message: `You missed a call from ${from.name}.`, actionUrl: '/messages', priority: 'Medium' }, io);
                    }
                    catch { }
                    live.invited.delete(u);
                }
                if (live.joined.size <= 1)
                    await endCall(live, 'no-answer');
                else
                    toCall(live, 'call:ringing_done', { callId: c.id });
            }, RING_MS);
            ack?.({ ok: true, callId: c.id, offline: targets.filter((t) => !online.includes(t)) });
        }
        catch (e) {
            ack?.({ ok: false, error: e.message });
        }
    });
    socket.on('call:accept', async ({ callId }, ack) => {
        const c = calls.get(callId);
        if (!c || !c.invited.has(userId))
            return ack?.({ ok: false, error: 'This call has ended' });
        if (c.joined.size >= MAX_PARTICIPANTS)
            return ack?.({ ok: false, error: 'Call is full' });
        const existing = [...c.joined.keys()];
        c.joined.set(userId, socket.id);
        if (!c.answeredAt)
            c.answeredAt = new Date();
        await logCall(c, userId, 'Active');
        for (const sid of h.getUserSockets(userId))
            if (sid !== socket.id)
                io.to(sid).emit('call:answered_elsewhere', { callId });
        toCall(c, 'call:participant_joined', { callId, userId, name: await nameOf(userId) }, userId);
        const peers = await Promise.all(existing.map(async (u) => ({ userId: u, name: await nameOf(u) })));
        ack?.({ ok: true, callType: c.callType, peers });
    });
    socket.on('call:decline', async ({ callId }) => {
        const c = calls.get(callId);
        if (!c || !c.invited.has(userId) || c.joined.has(userId))
            return;
        c.invited.delete(userId);
        await logCall(c, userId, 'Declined', new Date());
        for (const sid of h.getUserSockets(userId))
            io.to(sid).emit('call:ended', { callId, reason: 'declined' });
        toCall(c, 'call:declined', { callId, userId, name: await nameOf(userId) });
        const ringing = [...c.invited].filter((u) => !c.joined.has(u));
        if (c.joined.size <= 1 && ringing.length === 0)
            await endCall(c, 'declined');
    });
    socket.on('call:signal', ({ callId, toUserId, data }) => {
        const c = calls.get(callId);
        if (!c || !c.joined.has(userId))
            return;
        const sid = c.joined.get(Number(toUserId));
        if (sid)
            io.to(sid).emit('call:signal', { callId, fromUserId: userId, data });
    });
    socket.on('call:media_state', ({ callId, audio, video }) => {
        const c = calls.get(callId);
        if (c && c.joined.has(userId))
            toCall(c, 'call:media_state', { callId, userId, audio, video }, userId);
    });
    socket.on('call:invite', async ({ callId, userIds }) => {
        const c = calls.get(callId);
        if (!c || !c.joined.has(userId))
            return;
        const from = { id: userId, name: await nameOf(userId) };
        for (const u of (userIds || []).map(Number)) {
            if (c.invited.has(u) || c.invited.size >= MAX_PARTICIPANTS)
                continue;
            c.invited.add(u);
            await logCall(c, u, 'Ringing');
            h.emitToUser(io, u, 'call:incoming', { callId, from, callType: c.callType, conversationId: c.conversationId, title: c.title, participants: [...c.invited] });
        }
    });
    socket.on('call:leave', ({ callId }) => { leave(callId); });
    socket.on('disconnect', () => {
        for (const c of calls.values())
            if (c.joined.get(userId) === socket.id)
                leave(c.id);
    });
}
//# sourceMappingURL=calls.js.map