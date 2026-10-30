import { Router, Request } from 'express';
import crypto from 'crypto';
import { QueryTypes } from 'sequelize';
import { ErpModels } from './models';
import { wrap, ok, fail } from './recordRouter';
import { audit, db, emitChange, isManagement, notifyUsers, roleOf, userId, userName, userIdsWithRoles } from './helpers';

/**
 * Staff of the month (colleagues nominate, management chooses and announces)
 * and an anonymous suggestion box (the author is never stored).
 */

const q = (sql: string, replacements: any = {}) => db.query(sql, { replacements, type: QueryTypes.SELECT }) as Promise<any[]>;
const thisMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' }).slice(0, 7);
const monthLabel = (m: string) => new Date(`${m}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
const isHR = (req: Request) => isManagement(req) || roleOf(req) === 'hr';

async function allStaffUserIds(): Promise<number[]> {
  return (await q(`SELECT DISTINCT s."userId" FROM staff s JOIN users u ON u.id = s."userId" AND u."deletedAt" IS NULL WHERE s."deletedAt" IS NULL AND s.status = 'Active' AND s."userId" IS NOT NULL`)).map((r) => Number(r.userId));
}

/** 25th of each month: invite everyone to nominate. */
export async function nominationReminder(): Promise<void> {
  const m = thisMonth();
  if (await (ErpModels.Award as any).findOne({ where: { month: m } })) return;
  await notifyUsers(null, await allStaffUserIds(), {
    title: `Who should be staff of the month for ${monthLabel(m)}?`, type: 'Other',
    message: 'Nominate a colleague who went the extra mile this month. It takes a minute.', actionUrl: '/staff-of-the-month',
  });
}

/** One-way hash so each person can vote once without recording who voted. */
const voterHash = (uid: number, suggestionId: number) =>
  crypto.createHash('sha256').update(`${process.env.JWT_SECRET || 'maxhub'}:vote:${suggestionId}:${uid}`).digest('hex').slice(0, 32);

export const SUGGESTION_CATEGORIES = ['Workplace & welfare', 'Customers & service', 'Processes & tools', 'Money & costs', 'Training & growth', 'Concern or complaint', 'General'];

export function recognitionRouter(): Router {
  const r = Router();

  // ── Staff of the month ──────────────────────────────────────────────────
  r.get('/recognition', wrap(async (req, res) => {
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month || '')) ? String(req.query.month) : thisMonth();
    const me = userId(req);
    const myStaff = (await q(`SELECT id FROM staff WHERE "userId" = :u AND "deletedAt" IS NULL LIMIT 1`, { u: me }))[0];
    const winners = await q(
      `SELECT a.*, s."firstName", s."lastName", s.position, u.avatar, d.name AS "departmentName"
       FROM erp_awards a JOIN staff s ON s.id = a."staffId" LEFT JOIN users u ON u.id = s."userId" LEFT JOIN departments d ON d.id = s."departmentId"
       ORDER BY a.month DESC LIMIT 24`,
    );
    const mine = (await q(`SELECT n.*, s."firstName" || ' ' || s."lastName" AS "nomineeName" FROM erp_nominations n JOIN staff s ON s.id = n."nomineeStaffId" WHERE n.month = :m AND n."nominatorUserId" = :u`, { m: month, u: me }))[0] || null;
    const total = Number((await q(`SELECT COUNT(*)::int n FROM erp_nominations WHERE month = :m`, { m: month }))[0]?.n || 0);
    let nominees: any[] = [];
    if (isHR(req)) {
      const rows = await q(
        `SELECT n."nomineeStaffId", s."firstName" || ' ' || s."lastName" AS name, s.position, d.name AS "departmentName", u.avatar,
                json_agg(json_build_object('reason', n.reason, 'by', COALESCE(NULLIF(TRIM(nu."firstName" || ' ' || nu."lastName"), ''), nu.email), 'at', n."createdAt") ORDER BY n."createdAt") AS reasons
         FROM erp_nominations n JOIN staff s ON s.id = n."nomineeStaffId" LEFT JOIN users u ON u.id = s."userId" LEFT JOIN departments d ON d.id = s."departmentId"
         LEFT JOIN users nu ON nu.id = n."nominatorUserId"
         WHERE n.month = :m GROUP BY n."nomineeStaffId", s."firstName", s."lastName", s.position, d.name, u.avatar ORDER BY COUNT(*) DESC, name`, { m: month },
      );
      nominees = rows.map((x) => ({ staffId: Number(x.nomineeStaffId), name: x.name, position: x.position, departmentName: x.departmentName, avatar: x.avatar, votes: (x.reasons || []).length, reasons: x.reasons || [] }));
    }
    const people = await q(
      `SELECT s.id, s."firstName" || ' ' || s."lastName" AS name, s.position, d.name AS "departmentName" FROM staff s LEFT JOIN departments d ON d.id = s."departmentId"
       WHERE s."deletedAt" IS NULL AND s.status = 'Active' ${myStaff ? 'AND s.id <> :me' : ''} ORDER BY name`, { me: myStaff?.id || 0 },
    );
    const myWins = myStaff ? winners.filter((w) => Number(w.staffId) === Number(myStaff.id)).length : 0;
    const list = winners.map((w) => ({ ...w, id: Number(w.id), staffId: Number(w.staffId), name: `${w.firstName} ${w.lastName}`, monthLabel: monthLabel(w.month) }));
    return ok(res, {
      month, monthLabel: monthLabel(month), current: list.find((w) => w.month === month) || null, latest: list[0] || null,
      winners: list,
      myNomination: mine, totalNominations: total, nominees, people: people.map((p) => ({ ...p, id: Number(p.id) })), canAward: isManagement(req), canSeeNominations: isHR(req), myWins,
    });
  }));

  r.post('/recognition/nominate', wrap(async (req, res) => {
    const month = thisMonth();
    const me = userId(req);
    const staffId = Number(req.body?.staffId);
    const reason = String(req.body?.reason || '').trim().slice(0, 2000);
    if (!staffId) return fail(res, 400, 'Choose a colleague');
    if (reason.length < 10) return fail(res, 400, 'Say what they did — a sentence or two');
    const nominee = (await q(`SELECT id, "userId", "firstName" FROM staff WHERE id = :s AND "deletedAt" IS NULL AND status = 'Active'`, { s: staffId }))[0];
    if (!nominee) return fail(res, 404, 'Colleague not found');
    if (Number(nominee.userId) === me) return fail(res, 400, 'You cannot nominate yourself');
    if (await (ErpModels.Award as any).findOne({ where: { month } })) return fail(res, 400, 'This month’s staff of the month has already been chosen');
    const existing: any = await (ErpModels.Nomination as any).findOne({ where: { month, nominatorUserId: me } });
    if (existing) await existing.update({ nomineeStaffId: staffId, reason });
    else await (ErpModels.Nomination as any).create({ month, nomineeStaffId: staffId, nominatorUserId: me, reason });
    emitChange(req, 'nomination', 'updated', { id: staffId });
    return ok(res, { month }, existing ? 'Nomination changed' : `Thank you — ${nominee.firstName} has been nominated`);
  }));

  r.post('/recognition/award', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only management can choose staff of the month');
    const month = /^\d{4}-\d{2}$/.test(String(req.body?.month || '')) ? String(req.body.month) : thisMonth();
    const staffId = Number(req.body?.staffId);
    const s = (await q(`SELECT s.id, s."userId", s."firstName", s."lastName", s.position, s.email, s."departmentId" FROM staff s WHERE s.id = :s AND s."deletedAt" IS NULL`, { s: staffId }))[0];
    if (!s) return fail(res, 404, 'Staff member not found');
    const citation = String(req.body?.citation || '').trim().slice(0, 3000);
    if (citation.length < 10) return fail(res, 400, 'Write a short citation — why they won');
    const prize = req.body?.prize ? String(req.body.prize).slice(0, 200) : null;
    const existing: any = await (ErpModels.Award as any).findOne({ where: { month } });
    if (existing) await existing.update({ staffId, citation, prize, announcedById: userId(req), announcedByName: userName(req) });
    else await (ErpModels.Award as any).create({ month, staffId, citation, prize, announcedById: userId(req), announcedByName: userName(req) });
    const name = `${s.firstName} ${s.lastName}`;
    // Everyone hears about it.
    await notifyUsers(req, await allStaffUserIds(), { title: `🏆 Staff of the month: ${name}`, type: 'Other', priority: 'High', message: `${monthLabel(month)} — ${citation.slice(0, 200)}`, actionUrl: '/staff-of-the-month' }, { excludeSelf: Number(s.userId) });
    if (s.userId) await notifyUsers(req, [Number(s.userId)], { title: '🏆 You are staff of the month!', type: 'Other', priority: 'High', message: `Congratulations! ${citation.slice(0, 220)}`, actionUrl: '/staff-of-the-month' });
    try {
      const { postToGeneral } = require('./birthdays');
      await postToGeneral(`🏆 Staff of the month — ${monthLabel(month)}\n\nCongratulations to ${name}${s.position ? ` (${s.position})` : ''}!\n\n${citation}${prize ? `\n\nPrize: ${prize}` : ''}`);
    } catch (e: any) { console.error('[recognition] general post failed:', e.message); }
    try {
      const { brandEmailHtml, brandForDepartment, escapeHtml, sendBrandEmail } = require('./outbound');
      if (s.email) {
        const brand = await brandForDepartment(s.departmentId ? Number(s.departmentId) : null);
        await sendBrandEmail(brand, s.email, `You are staff of the month, ${s.firstName}! 🏆`, brandEmailHtml(brand, `Congratulations, ${escapeHtml(s.firstName)}!`,
          `<p>You have been named <b>staff of the month for ${monthLabel(month)}</b>.</p><p>${escapeHtml(citation)}</p>${prize ? `<p><b>Prize:</b> ${escapeHtml(prize)}</p>` : ''}<p>Thank you for everything you do.</p>`));
      }
    } catch (e: any) { console.error('[recognition] email failed:', e.message); }
    await audit(req, 'Recognition', 'Award', 'Staff', staffId, `${userName(req)} named ${name} staff of the month for ${monthLabel(month)}`);
    emitChange(req, 'award', 'created', { id: staffId });
    return ok(res, { month, staffId }, `${s.firstName} is staff of the month — everyone has been told`);
  }));

  r.delete('/recognition/award/:month', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only management can undo an award');
    const row: any = await (ErpModels.Award as any).findOne({ where: { month: req.params.month } });
    if (!row) return fail(res, 404, 'No award for that month');
    await row.destroy();
    await audit(req, 'Recognition', 'Delete', 'Award', row.staffId, `${userName(req)} removed the staff of the month award for ${monthLabel(row.month)}`);
    return ok(res, null, 'Award removed');
  }));

  // ── Anonymous suggestions ───────────────────────────────────────────────
  r.get('/suggestions', wrap(async (req, res) => {
    const mgmt = isHR(req);
    const rows: any[] = await (ErpModels.Suggestion as any).findAll({ where: mgmt ? {} : { isPublic: true }, order: [['createdAt', 'DESC']], raw: true });
    const me = userId(req);
    return ok(res, {
      categories: SUGGESTION_CATEGORIES, canManage: mgmt,
      suggestions: rows.map((s) => {
        const votes: string[] = Array.isArray(s.voterHashes) ? s.voterHashes : [];
        const { voterHashes, ...rest } = s; void voterHashes;
        return { ...rest, id: Number(s.id), votes: votes.length, iVoted: votes.includes(voterHash(me, Number(s.id))) };
      }),
    });
  }));

  // Deliberately no audit entry, no user id and no name: the box is anonymous.
  const recent = new Map<number, number[]>();
  r.post('/suggestions', wrap(async (req, res) => {
    const me = userId(req);
    const now = Date.now();
    const times = (recent.get(me) || []).filter((t) => now - t < 3600_000);
    if (times.length >= 5) return fail(res, 429, 'You have sent several suggestions in the last hour — please try again later');
    recent.set(me, [...times, now]);
    const title = String(req.body?.title || '').trim().slice(0, 200);
    const body = String(req.body?.body || '').trim().slice(0, 5000);
    if (!title || body.length < 10) return fail(res, 400, 'Give it a title and a few words of detail');
    const category = SUGGESTION_CATEGORIES.includes(req.body?.category) ? req.body.category : 'General';
    const code = `S-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const row: any = await (ErpModels.Suggestion as any).create({ code, category, title, body, status: 'New', isPublic: false, voterHashes: [] });
    await notifyUsers(null, await userIdsWithRoles(['superadmin', 'admin', 'hr']), { title: 'New anonymous suggestion', type: 'Other', message: `${category}: “${title}”`, actionUrl: `/suggestions?open=${row.id}` });
    emitChange(null, 'suggestion', 'created', { id: row.id });
    return ok(res, { code }, `Sent anonymously. Your reference is ${code} — watch the board for a reply.`, 201);
  }));

  r.post('/suggestions/:id(\\d+)/vote', wrap(async (req, res) => {
    const row: any = await (ErpModels.Suggestion as any).findByPk(req.params.id);
    if (!row || (!row.isPublic && !isHR(req))) return fail(res, 404, 'Suggestion not found');
    const h = voterHash(userId(req), Number(row.id));
    const votes: string[] = Array.isArray(row.voterHashes) ? row.voterHashes : [];
    const next = votes.includes(h) ? votes.filter((v) => v !== h) : [...votes, h];
    await row.update({ voterHashes: next });
    return ok(res, { votes: next.length, iVoted: next.includes(h) });
  }));

  r.put('/suggestions/:id(\\d+)', wrap(async (req, res) => {
    if (!isHR(req)) return fail(res, 403, 'Only management and HR can respond to suggestions');
    const row: any = await (ErpModels.Suggestion as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Suggestion not found');
    const b = req.body || {};
    const data: any = {};
    if (['New', 'Under review', 'Planned', 'Done', 'Not now'].includes(b.status)) data.status = b.status;
    if (typeof b.isPublic === 'boolean') data.isPublic = b.isPublic;
    if (b.reply !== undefined && String(b.reply).trim() !== String(row.reply || '')) Object.assign(data, { reply: String(b.reply).trim().slice(0, 5000) || null, repliedByName: userName(req), repliedAt: new Date() });
    const goingPublic = data.isPublic === true && !row.isPublic;
    await row.update(data);
    if (goingPublic) await notifyUsers(req, await allStaffUserIds(), { title: 'A suggestion has been answered', type: 'Other', message: `“${row.title}” — ${row.status}`, actionUrl: `/suggestions?open=${row.id}` }, { excludeSelf: userId(req) });
    await audit(req, 'Suggestions', 'Update', 'Suggestion', row.id, `${userName(req)} updated suggestion ${row.code} (${row.status}${row.isPublic ? ', on the board' : ''})`);
    emitChange(req, 'suggestion', 'updated', { id: row.id });
    return ok(res, row, 'Saved');
  }));

  r.delete('/suggestions/:id(\\d+)', wrap(async (req, res) => {
    if (!isManagement(req)) return fail(res, 403, 'Only management can delete suggestions');
    const row: any = await (ErpModels.Suggestion as any).findByPk(req.params.id);
    if (!row) return fail(res, 404, 'Suggestion not found');
    await row.destroy();
    await audit(req, 'Suggestions', 'Delete', 'Suggestion', row.id, `${userName(req)} deleted suggestion ${row.code}`);
    return ok(res, { id: row.id }, 'Deleted');
  }));

  return r;
}
