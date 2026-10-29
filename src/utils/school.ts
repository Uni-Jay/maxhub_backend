import { QueryTypes } from 'sequelize';
import sequelize from '@config/Database';

/**
 * MaxHub runs two separate schools that must never see each other's students:
 *   KS — Kurios SAT ICT Training Center (departments KS, KS-TRN)
 *   BM — Beadmax Design Vocational School (departments BM, BM-VOC)
 * Lists accept ?school=KS|BM and are limited to that school's departments.
 */
export const SCHOOL_DEPARTMENT_CODES: Record<string, string[]> = {
  KS: ['KS', 'KS-TRN'],
  BM: ['BM', 'BM-VOC'],
};

export function normaliseSchool(v: any): 'KS' | 'BM' | null {
  const s = String(v || '').toUpperCase().split('-')[0];
  return s === 'KS' || s === 'BM' ? s : null;
}

export async function schoolDepartmentIds(school: any): Promise<number[] | null> {
  const s = normaliseSchool(school);
  if (!s) return null;
  const rows: any[] = await sequelize.query(
    `SELECT id FROM departments WHERE UPPER(code) IN (:codes) AND "deletedAt" IS NULL`,
    { replacements: { codes: SCHOOL_DEPARTMENT_CODES[s] }, type: QueryTypes.SELECT },
  );
  return rows.map((r) => Number(r.id));
}

/** Which school a department belongs to (null for non-school departments). */
export async function schoolOfDepartment(departmentId: any): Promise<'KS' | 'BM' | null> {
  if (!departmentId) return null;
  const rows: any[] = await sequelize.query(
    `SELECT d.code, p.code AS parent FROM departments d LEFT JOIN departments p ON p.id = d."parentDepartmentId" WHERE d.id = :id`,
    { replacements: { id: departmentId }, type: QueryTypes.SELECT },
  );
  const code = String(rows[0]?.parent || rows[0]?.code || '').toUpperCase();
  return normaliseSchool(code);
}

/** The department new records for a school go into (the school division, falling back to the brand). */
export async function schoolDefaultDepartmentId(school: any): Promise<number | null> {
  const s = normaliseSchool(school);
  if (!s) return null;
  const rows: any[] = await sequelize.query(
    `SELECT id, code FROM departments WHERE UPPER(code) IN (:codes) AND "deletedAt" IS NULL`,
    { replacements: { codes: SCHOOL_DEPARTMENT_CODES[s] }, type: QueryTypes.SELECT },
  );
  const division = rows.find((r) => String(r.code).includes('-'));
  return Number((division || rows[0])?.id) || null;
}
