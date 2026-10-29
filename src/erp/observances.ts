/**
 * Nigerian public holidays and international celebrations for any year.
 * Fixed dates and Easter-based dates are calculated; Islamic holidays
 * follow the moon, so they use the expected dates (the Federal Government
 * confirms them shortly before) and are flagged as expected.
 */

export interface Observance {
  date: string; // YYYY-MM-DD
  name: string;
  kind: 'public-holiday' | 'celebration';
  note?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Western (Gregorian) Easter Sunday — Anonymous Gregorian algorithm. */
export function easterSunday(y: number): string {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return iso(y, month, day);
}

/** n-th weekday (0 = Sunday) of a month; n = -1 means the last one. */
function nthWeekday(y: number, month: number, weekday: number, n: number): string {
  if (n > 0) {
    const first = new Date(Date.UTC(y, month - 1, 1)).getUTCDay();
    return iso(y, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
  }
  const lastDay = new Date(Date.UTC(y, month, 0)).getUTCDate();
  const last = new Date(Date.UTC(y, month - 1, lastDay)).getUTCDay();
  return iso(y, month, lastDay - ((last - weekday + 7) % 7));
}

/** Expected Islamic holiday dates in Nigeria (moon sighting confirms). */
const ISLAMIC: Record<number, { fitr: string; adha: string; maulid: string; ramadan: string }> = {
  2024: { ramadan: '2024-03-11', fitr: '2024-04-10', adha: '2024-06-16', maulid: '2024-09-16' },
  2025: { ramadan: '2025-03-01', fitr: '2025-03-30', adha: '2025-06-06', maulid: '2025-09-05' },
  2026: { ramadan: '2026-02-18', fitr: '2026-03-20', adha: '2026-05-27', maulid: '2026-08-26' },
  2027: { ramadan: '2027-02-08', fitr: '2027-03-10', adha: '2027-05-16', maulid: '2027-08-15' },
  2028: { ramadan: '2028-01-28', fitr: '2028-02-27', adha: '2028-05-05', maulid: '2028-08-04' },
  2029: { ramadan: '2029-01-16', fitr: '2029-02-15', adha: '2029-04-24', maulid: '2029-07-24' },
  2030: { ramadan: '2030-01-06', fitr: '2030-02-05', adha: '2030-04-14', maulid: '2030-07-14' },
};

export function observancesForYear(y: number): Observance[] {
  const out: Observance[] = [];
  const pub = (date: string, name: string, note?: string) => out.push({ date, name, kind: 'public-holiday', note });
  const cel = (date: string, name: string, note?: string) => out.push({ date, name, kind: 'celebration', note });

  // ── Nigerian public holidays ──
  pub(iso(y, 1, 1), "New Year's Day");
  const easter = easterSunday(y);
  pub(addDays(easter, -2), 'Good Friday');
  pub(addDays(easter, 1), 'Easter Monday');
  pub(iso(y, 5, 1), "Workers' Day");
  pub(iso(y, 6, 12), 'Democracy Day');
  pub(iso(y, 10, 1), 'Independence Day');
  pub(iso(y, 12, 25), 'Christmas Day');
  pub(iso(y, 12, 26), 'Boxing Day');
  const isl = ISLAMIC[y];
  if (isl) {
    const note = 'Expected date — the Federal Government confirms it after the moon is sighted';
    pub(isl.fitr, 'Eid al-Fitr (Sallah)', note);
    pub(addDays(isl.fitr, 1), 'Eid al-Fitr holiday', note);
    pub(isl.adha, 'Eid al-Adha (Sallah)', note);
    pub(addDays(isl.adha, 1), 'Eid al-Adha holiday', note);
    pub(isl.maulid, 'Eid-el-Maulud (Prophet’s Birthday)', note);
    cel(isl.ramadan, 'Ramadan begins', 'Expected date');
  }

  // ── Celebrations & international days ──
  cel(iso(y, 1, 24), 'International Day of Education');
  cel(iso(y, 2, 14), "Valentine's Day");
  cel(iso(y, 3, 8), "International Women's Day");
  cel(addDays(easter, -21), "Mothering Sunday (Mother's Day)", 'Celebrated in Nigeria three weeks before Easter');
  cel(addDays(easter, -46), 'Ash Wednesday — Lent begins');
  cel(addDays(easter, -7), 'Palm Sunday');
  cel(easter, 'Easter Sunday');
  cel(iso(y, 4, 7), 'World Health Day');
  cel(iso(y, 4, 22), 'Earth Day');
  cel(nthWeekday(y, 5, 0, 2), "Mother's Day (international)");
  cel(iso(y, 5, 27), "Children's Day (Nigeria)", 'Schools close');
  cel(iso(y, 6, 5), 'World Environment Day');
  cel(nthWeekday(y, 6, 0, 3), "Father's Day");
  cel(iso(y, 8, 12), 'International Youth Day');
  cel(iso(y, 9, 8), 'International Literacy Day');
  cel(iso(y, 9, 27), 'World Tourism Day', 'VisaMax');
  cel(iso(y, 10, 5), "World Teachers' Day");
  cel(iso(y, 10, 10), 'World Mental Health Day');
  cel(iso(y, 10, 16), 'World Food Day', 'Maxfood Farm');
  cel(iso(y, 10, 31), 'Halloween');
  cel(nthWeekday(y, 11, 4, 4), 'Thanksgiving (USA)');
  cel(addDays(nthWeekday(y, 11, 4, 4), 1), 'Black Friday', 'Big online shopping day — BeadMax');
  cel(addDays(nthWeekday(y, 11, 4, 4), 4), 'Cyber Monday');
  cel(iso(y, 12, 24), 'Christmas Eve');
  cel(iso(y, 12, 31), "New Year's Eve");

  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'public-holiday' ? -1 : 1));
}

/** Observances between two dates (inclusive). */
export function observancesBetween(start: string, end: string): Observance[] {
  const y1 = Number(start.slice(0, 4)), y2 = Number(end.slice(0, 4));
  const list: Observance[] = [];
  for (let y = y1; y <= y2; y++) list.push(...observancesForYear(y));
  return list.filter((o) => o.date >= start && o.date <= end);
}
