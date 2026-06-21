// Mirrors the Postgres enum backing Message.messageType (see
// Message.model.ts) — kept as a plain list here since Sequelize's
// DataTypes.ENUM(...) call isn't something other modules can import values
// out of directly.
export const ALLOWED_MESSAGE_TYPES = [
  'Text', 'Image', 'File', 'Link', 'Emoji', 'Mention', 'Video', 'Voice', 'Audio',
] as const;

export type MessageType = typeof ALLOWED_MESSAGE_TYPES[number];

/**
 * A client sending an unrecognized messageType (a stale build, a bad
 * manual API call, a future enum value a build doesn't know about yet)
 * used to reach Message.create() unchecked — Postgres then rejected the
 * enum value and that database error surfaced to the client as a bare 500
 * with no indication of what was actually wrong. Validating before the
 * insert turns that into a normal fallback instead of a crash.
 */
export function sanitizeMessageType(value: unknown, hasAttachment: boolean): MessageType {
  if (typeof value === 'string' && (ALLOWED_MESSAGE_TYPES as readonly string[]).includes(value)) {
    return value as MessageType;
  }
  return hasAttachment ? 'File' : 'Text';
}
