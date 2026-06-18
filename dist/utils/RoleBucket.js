"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleBucket = getRoleBucket;
function normaliseRole(r) {
    return r.toLowerCase().replace(/[^a-z]/g, '');
}
function getRoleBucket(req) {
    const roles = (req.user?.roles ?? []).map(normaliseRole);
    if (roles.includes('superadmin'))
        return 'superadmin';
    if (roles.includes('admin') || roles.includes('headofadmin'))
        return 'admin';
    if (roles.includes('hr'))
        return 'hr';
    if (roles.includes('hod'))
        return 'hod';
    return 'staff';
}
//# sourceMappingURL=RoleBucket.js.map