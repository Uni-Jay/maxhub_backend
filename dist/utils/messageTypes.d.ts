export declare const ALLOWED_MESSAGE_TYPES: readonly ["Text", "Image", "File", "Link", "Emoji", "Mention", "Video", "Voice", "Audio"];
export type MessageType = typeof ALLOWED_MESSAGE_TYPES[number];
export declare function sanitizeMessageType(value: unknown, hasAttachment: boolean): MessageType;
//# sourceMappingURL=messageTypes.d.ts.map