const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Builds a safe where-clause for routes that accept either a numeric id or a
 * uuid in the same :id param. Postgres validates every Op.or branch's literal
 * against its column's type before evaluating any of them, so
 * `{ [Op.or]: [{ id: value }, { uuid: value }] }` throws "invalid input
 * syntax for type uuid" when value is numeric, and would equally throw
 * "invalid input syntax for type bigint" when value is an actual uuid.
 * MySQL was permissive about this; Postgres is not. Pick exactly one
 * column to compare against instead of asking Postgres to evaluate both.
 */
export function idOrUuidWhere(value: string, idField = 'id', uuidField = 'uuid'): Record<string, unknown> {
  if (/^\d+$/.test(value)) return { [idField]: value };
  if (UUID_RE.test(value)) return { [uuidField]: value };
  return { [idField]: -1 };
}
