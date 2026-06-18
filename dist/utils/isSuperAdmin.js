"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdmin = isSuperAdmin;
function isSuperAdmin(req) {
    return (req.user?.roles || []).some((r) => r.toLowerCase().replace(/[^a-z]/g, '') === 'superadmin');
}
//# sourceMappingURL=isSuperAdmin.js.map