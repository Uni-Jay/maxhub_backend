"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserDepartmentIds = getUserDepartmentIds;
exports.getMultiDeptScope = getMultiDeptScope;
const Staff_model_1 = require("../models/Staff.model");
const StaffDepartment_model_1 = require("../models/StaffDepartment.model");
async function getUserDepartmentIds(userId) {
    const staff = await Staff_model_1.Staff.findOne({ where: { userId }, attributes: ['id', 'departmentId'] });
    if (!staff)
        return [];
    const ids = new Set();
    const primaryDeptId = staff.departmentId;
    if (primaryDeptId)
        ids.add(Number(primaryDeptId));
    const links = await StaffDepartment_model_1.StaffDepartment.findAll({ where: { staffId: staff.id }, attributes: ['departmentId'] });
    links.forEach((l) => ids.add(Number(l.departmentId)));
    return [...ids];
}
async function getMultiDeptScope(req, allPermission) {
    const user = req.user;
    const normRoles = (user.roles || []).map((r) => r.toLowerCase().replace(/[^a-z]/g, ''));
    if (normRoles.includes('superadmin') || normRoles.includes('admin') || normRoles.includes('headofadmin')) {
        return { scoped: false, departmentIds: [] };
    }
    const perms = new Set((user.permissions || []).map((p) => p.toLowerCase()));
    if (perms.has(allPermission.toLowerCase())) {
        return { scoped: false, departmentIds: [] };
    }
    const departmentIds = await getUserDepartmentIds(user.id);
    return { scoped: true, departmentIds };
}
//# sourceMappingURL=departmentScope.js.map