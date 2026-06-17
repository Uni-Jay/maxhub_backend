"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idOrUuidWhere = idOrUuidWhere;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function idOrUuidWhere(value, idField = 'id', uuidField = 'uuid') {
    if (/^\d+$/.test(value))
        return { [idField]: value };
    if (UUID_RE.test(value))
        return { [uuidField]: value };
    return { [idField]: -1 };
}
//# sourceMappingURL=idOrUuid.js.map