"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_MESSAGE_TYPES = void 0;
exports.sanitizeMessageType = sanitizeMessageType;
exports.ALLOWED_MESSAGE_TYPES = [
    'Text', 'Image', 'File', 'Link', 'Emoji', 'Mention', 'Video', 'Voice', 'Audio',
];
function sanitizeMessageType(value, hasAttachment) {
    if (typeof value === 'string' && exports.ALLOWED_MESSAGE_TYPES.includes(value)) {
        return value;
    }
    return hasAttachment ? 'File' : 'Text';
}
//# sourceMappingURL=messageTypes.js.map