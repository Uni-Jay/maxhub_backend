"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSuperAdminOnly = isSuperAdminOnly;
exports.requesterIsHrOrAdmin = requesterIsHrOrAdmin;
const Staff_model_1 = require("../models/Staff.model");
const User_model_1 = require("../models/User.model");
const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
function isSuperAdminOnly(req) {
    const roles = (req.user?.roles || []).map(norm);
    return roles.includes('superadmin');
}
async function requesterIsHrOrAdmin(staffId) {
    if (!staffId)
        return false;
    const staff = await Staff_model_1.Staff.findByPk(staffId, { attributes: ['userId'] });
    if (!staff || !staff.userId)
        return false;
    const user = await User_model_1.User.findByPk(staff.userId);
    if (!user)
        return false;
    const roles = await user.getRoles();
    const roleCodes = roles.map((r) => norm(r.code));
    return roleCodes.includes('hr') || roleCodes.includes('admin');
}
//# sourceMappingURL=leaveApproval.js.map