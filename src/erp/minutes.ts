import { Router, Request } from 'express';
import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { ErpModels } from './models';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, emitChange, isManagement, nextCode, notifyUsers, userId, userName } from './helpers';

/**
 * Meeting minutes: who came, what was discussed, what was decided and who
 * does what by when. Sharing the minutes turns each action point into a task
 * for its owner and sends everyone the summary. AI can tidy rough notes.
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;

interface Person { userId: number; name: string }
interface Action { id: string; text: string; ownerUserId: number | null; ownerName: string | null; due: string | null; taskId: number | null }

const cleanPeople = (v: any): Person[] => (Array.isArray(v) ? v : []).map((p: any) => ({ userId: Number(p?.userId), name: String(p?.name || '').slice(0, 160) })).filter((p: Person) => p.userId && p.name).slice(0, 100);
const cleanActions = (v: any): Action[] => (Array.isArray(v) ? v : []).map((a: any) => ({
  id: String(a?.id || crypto.randomBytes(4).toString('hex')), text: String(a?.text || '').trim().slice(0, 500),
  ownerUserId: a?.ownerUserId ? Number(a.ownerUserId) : null, ownerName: a?.ownerName ? String(a.ownerName).slice(0, 160) : null,
  due: /^\d{4}-\d{2}-\d{2}$/.test(String(a?.due || '')) ? String(a.due) : null, taskId: a?.taskId ? Number(a.taskId) : null,
})).filter((a: Action) => a.text).slice(0, 60);
const cleanDecisions = (v: any): string[] => (Array.isArray(v) ? v : []).map((d: any) => String(d || '').trim().slice(0, 500)).filter(Boolean).slice(0, 60);

function canSee(req: Request, m: any): boolean {
  const me = userId(req);
  return isManagement(req) || Number(m.createdById) === me || (m.status === 'Shared' && (m.attendees || []).concat(m.apologies || []).some((p: Person) => Number(p.userId) === me))
    || (m.status === 'Shared' && (m.actions || []).some((a: Action) => Number(a.ownerUserId) === me));
}
const canEdit = (req: Request, m: any) => isManagement(req) || Number(m.createdById) === userId(req);

async function staffIdOf(uid: number): Promise<number | null> {
  const r = (await q(`SELECT id FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: uid }))[0];
  return r ? Number(r.id) : null;
}

/** Turns action points into tasks (once each) and returns the updated list. */
async function createTasks(req: Request, m: any): Promise<Action[]> {
  const { Task } = require('@models/Task.model');
  const reporter = (await staffIdOf(userId(req))) ?? userId(req);
  const out: Action[] = [];
  for (const a of (m.actions || []) as Action[]) {
    if (a.taskId || !a.ownerUserId) { out.push(a); continue; }
    const assignee = await staffIdOf(Number(a.ownerUserId));
    try {
      const t: any = await Task.create({
        title: a.text.slice(0, 200), description: `Action point from “${m.title}” (${new Date(m.heldAt).toLocaleDateString('en-GB', { dateStyle: 'medium' })}). Minutes: ${m.code}`,
        taskCode: `MIN${Date.now()}${Math.floor(Math.random() * 100)}`, assigneeId: assignee ?? undefined, reporterId: reporter,
        priority: 'Medium', status: 'Todo', dueDate: a.due ? new Date(`${a.due}T17:00:00+01:00`) : undefined, label: 'Meeting action',
      });
      out.push({ ...a, taskId: Number(t.id) });
    } catch (e: any) { console.error('[minutes] task failed:', e.message); out.push(a); }
  }
  return out;
}

export function minutesRouter(): Router {
  const r = Router();

  r.get('/minutes', wrap(async (req, res) => {
    const rows: any[] = await (ErpModels.Minutes as any).findAll({ order: [['heldAt', 'DESC']], limit: 300, raw: true });
    const visible = rows.filter((m) => canSee(req, m));
    const me = userId(req);
    const taskIds = visible.flatMap((m) => (m.actions || []).map((a: Action) => a.taskId)).filter(Boolean);
    const tasks = taskIds.length ? await q(`SELECT id, status FROM tasks WHERE id IN (:ids)`, { ids: taskIds }) : [];
    const ts = new Map(tasks.map((t) => [Number(t.id), t.status]));
    return ok(res, visible.map((m) => {
      const actions = (m.actions || []).map((a: Action) => ({ ...a, taskStatus: a.taskId ? ts.get(Number(a.taskId)) || null : null }));
      return {
        ...m, id: Number(m.id), actions, canEdit: canEdit(req, m),
        openActions: actions.filter((a: any) => !['Done', 'Cancelled'].includes(a.taskStatus)).length,
        myActions: actions.filter((a: any) => Number(a.ownerUserId) === me && !['Done', 'Cancelled'].includes(a.taskStatus)).length,
      };
    }));
  }));

  r.get('/minutes/meetings', wrap(async (req, res) => {
    const rows = await q(
      `SELECT m.id, m.title, m."scheduledAt", m."meetingType" FROM meetings m WHERE m."deletedAt" IS NULL AND m."scheduledAt" > NOW() - INTERVAL '60 days'
       AND (m."hostUserId" = :u OR EXISTS (SELECT 1 FROM meeting_participants p WHERE p."meetingId" = m.id AND p."userId" = :u)) ORDER BY m."scheduledAt" DESC LIMIT 40`, { u: userId(req) },
    ).catch(() => [] as any[]);
    const out = [];
    for (const m of rows) {
      const people = await q(
        `SELECT DISTINCT u.id AS "userId", COALESCE(NULLIF(TRIM(COALESCE(u."firstName",'') || ' ' || COALESCE(u."lastName",'')), ''), u.email) AS name
         FROM users u WHERE u.id IN (SELECT "userId" FROM meeting_participants WHERE "meetingId" = :m UNION SELECT "hostUserId" FROM meetings WHERE id = :m)`, { m: m.id },
      ).catch(() => [] as any[]);
      out.push({ ...m, id: Number(m.id), people: people.map((p) => ({ userId: Number(p.userId), name: p.name })) });
    }
    return ok(res, out);
  }));

  r.post('/minutes', wrap(async (req, res) => {
    const b = req.body || {};
    const title = String(b.title || '').trim().slice(0, 200);
    if (!title) return fail(res, 400, 'Give the meeting a title');
    const heldAt = b.heldAt ? new Date(b.heldAt) : new Date();
    const row: any = await (ErpModels.Minutes as any).create({
      code: await nextCode('MIN'), title, meetingId: b.meetingId ? Number(b.meetingId) : null, heldAt, location: b.location || null,
      attendees: cleanPeople(b.attendees), apologies: cleanPeople(b.apologies), agenda: b.agenda || null, notes: b.notes || null,
      decisions: cleanDecisions(b.decisions), actions: cleanActions(b.actions), nextMeetingAt: b.nextMeetingAt ? new Date(b.nextMeetingAt) : null,
      status: 'Draft', departmentId: b.departmentId || null, createdById: userId(req), createdByName: userName(req),
    });
    await audit(req, 'Minutes', 'Create', 'Minutes', row.id, `${userName(req)} wrote minutes for “${title}”`);
    emitChange(req, 'minutes', 'created', row);
    return ok(res, row, 'Minutes saved', 201);
  }));

  r.put('/minutes/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.Minutes as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Minutes not found');
    if (!canEdit(req, row)) return fail(res, 403, 'Only the person who wrote the minutes (or management) can change them');
    const b = req.body || {};
    const data: any = {};
    if (b.title !== undefined) data.title = String(b.title).trim().slice(0, 200) || row.title;
    for (const k of ['location', 'agenda', 'notes']) if (b[k] !== undefined) data[k] = b[k] || null;
    if (b.heldAt) data.heldAt = new Date(b.heldAt);
    if (b.nextMeetingAt !== undefined) data.nextMeetingAt = b.nextMeetingAt ? new Date(b.nextMeetingAt) : null;
    if (b.meetingId !== undefined) data.meetingId = b.meetingId ? Number(b.meetingId) : null;
    if (b.attendees !== undefined) data.attendees = cleanPeople(b.attendees);
    if (b.apologies !== undefined) data.apologies = cleanPeople(b.apologies);
    if (b.decisions !== undefined) data.decisions = cleanDecisions(b.decisions);
    if (b.actions !== undefined) {
      // Keep task links for action points that already became tasks.
      const prev = (row.actions || []) as Action[];
      const byId = new Map(prev.map((a) => [a.id, a]));
      const byText = new Map(prev.map((a) => [a.text.trim().toLowerCase(), a]));
      data.actions = cleanActions(b.actions).map((a) => ({ ...a, taskId: a.taskId || byId.get(a.id)?.taskId || byText.get(a.text.trim().toLowerCase())?.taskId || null }));
    }
    await row.update(data);
    if (row.status === 'Shared' && b.actions !== undefined) {
      await row.update({ actions: await createTasks(req, row.get({ plain: true })) });
    }
    emitChange(req, 'minutes', 'updated', row);
    return ok(res, row, 'Minutes saved');
  }));

  r.post('/minutes/:id(\\d+)/share', wrap(async (req, res) => {
    const row: any = await (ErpModels.Minutes as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Minutes not found');
    if (!canEdit(req, row)) return fail(res, 403, 'Only the person who wrote the minutes can share them');
    const plain = row.get({ plain: true });
    const actions = await createTasks(req, plain);
    await row.update({ actions, status: 'Shared', sharedAt: new Date() });
    const people = new Set<number>([...(plain.attendees || []), ...(plain.apologies || [])].map((p: Person) => Number(p.userId)));
    actions.forEach((a) => a.ownerUserId && people.add(Number(a.ownerUserId)));
    await notifyUsers(req, [...people], {
      title: `Minutes: ${row.title}`, type: 'Other',
      message: `${(plain.decisions || []).length} decision${(plain.decisions || []).length === 1 ? '' : 's'} and ${actions.length} action point${actions.length === 1 ? '' : 's'}. Open to read.`,
      actionUrl: `/minutes?open=${row.id}`,
    }, { excludeSelf: userId(req) });
    for (const a of actions) {
      if (!a.ownerUserId || a.ownerUserId === userId(req)) continue;
      await notifyUsers(req, [a.ownerUserId], { title: 'Action point for you', type: 'Assignment', message: `${a.text}${a.due ? ` — by ${new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''} (from “${row.title}”)`, actionUrl: a.taskId ? `/tasks/${a.taskId}` : `/minutes?open=${row.id}` });
    }
    await audit(req, 'Minutes', 'Share', 'Minutes', row.id, `${userName(req)} shared minutes for “${row.title}” (${actions.filter((a) => a.taskId).length} tasks created)`);
    emitChange(req, 'minutes', 'updated', row);
    return ok(res, row, `Shared — ${actions.filter((a) => a.taskId).length} task${actions.filter((a) => a.taskId).length === 1 ? '' : 's'} created`);
  }));

  r.delete('/minutes/:id(\\d+)', wrap(async (req, res) => {
    const row: any = await (ErpModels.Minutes as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Minutes not found');
    if (!canEdit(req, row)) return fail(res, 403, 'You cannot delete these minutes');
    await row.destroy();
    await audit(req, 'Minutes', 'Delete', 'Minutes', row.id, `${userName(req)} deleted minutes “${row.title}”`);
    emitChange(req, 'minutes', 'deleted', { id: row.id });
    return ok(res, { id: row.id }, 'Minutes deleted');
  }));

  /** AI: turn rough notes into a summary, decisions and action points. */
  r.post('/minutes/ai-tidy', wrap(async (req, res) => {
    const notes = String(req.body?.notes || '').trim().slice(0, 15000);
    if (notes.length < 20) return fail(res, 400, 'Type or paste your rough notes first');
    const people: Person[] = cleanPeople(req.body?.attendees);
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const prompt = `You are writing clear meeting minutes for a Nigerian company. Today is ${today}.
People at the meeting: ${people.map((p) => `${p.name} (id ${p.userId})`).join(', ') || 'not listed'}.
Rough notes:
"""${notes}"""
Return ONLY JSON: {"notes": "a tidy summary of the discussion in short paragraphs or '-' bullets (plain text, no markdown)",
"decisions": ["each decision as one sentence"],
"actions": [{"text": "what must be done, starting with a verb", "ownerUserId": id of the person from the list or null, "due": "YYYY-MM-DD" or null}]}
Only use due dates that the notes state or clearly imply (e.g. "by Friday"). Do not invent facts.`;
    let out: string;
    try {
      const { getActiveProvider } = require('../modules/ai/providers/ProviderFactory');
      out = await getActiveProvider().generate(prompt, undefined, 0.3);
    } catch (e: any) { return fail(res, e.status || 503, e.message || 'The AI could not tidy these notes right now'); }
    const t = out.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    let j: any = null;
    try { j = JSON.parse(t); } catch { const m = t.match(/\{[\s\S]*\}/); if (m) try { j = JSON.parse(m[0]); } catch { /* ignore */ } }
    if (!j) return fail(res, 422, 'The AI reply could not be read — please try again');
    const byId = new Map(people.map((p) => [p.userId, p.name]));
    return ok(res, {
      notes: String(j.notes || '').replace(/\*\*/g, ''), decisions: cleanDecisions(j.decisions),
      actions: cleanActions((j.actions || []).map((a: any) => ({ ...a, ownerName: a.ownerUserId ? byId.get(Number(a.ownerUserId)) || null : null, ownerUserId: byId.has(Number(a.ownerUserId)) ? Number(a.ownerUserId) : null }))),
    });
  }));

  return r;
}
