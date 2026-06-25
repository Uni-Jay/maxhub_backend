/**
 * Date.prototype.toISOString()/toJSON() always output UTC, regardless of
 * process.env.TZ - so it's the wrong tool for "what is today's calendar
 * date" (e.g. attendance bucketing), which must reflect the local (Lagos)
 * date even right around the UTC midnight boundary. Use local-aware
 * getters instead, which do respect process.env.TZ.
 */
export function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
