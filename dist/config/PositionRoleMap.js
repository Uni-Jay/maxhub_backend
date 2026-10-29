"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSITION_ROLE_MAP = void 0;
exports.resolveRoleForPosition = resolveRoleForPosition;
const RolesConfig_1 = require("./RolesConfig");
exports.POSITION_ROLE_MAP = {
    'ceo': RolesConfig_1.RoleCode.SUPERADMIN,
    'chief executive officer': RolesConfig_1.RoleCode.SUPERADMIN,
    'developer': RolesConfig_1.RoleCode.SUPERADMIN,
    'lead developer': RolesConfig_1.RoleCode.SUPERADMIN,
    'software developer': RolesConfig_1.RoleCode.SUPERADMIN,
    'manager': RolesConfig_1.RoleCode.ADMIN,
    'general manager': RolesConfig_1.RoleCode.ADMIN,
    'director': RolesConfig_1.RoleCode.ADMIN,
    'managing director': RolesConfig_1.RoleCode.ADMIN,
    'executive director': RolesConfig_1.RoleCode.ADMIN,
    'head of admin': RolesConfig_1.RoleCode.ADMIN,
    'head admin': RolesConfig_1.RoleCode.ADMIN,
    'head of administration': RolesConfig_1.RoleCode.ADMIN,
    'head hr': RolesConfig_1.RoleCode.ADMIN,
    'head of hr': RolesConfig_1.RoleCode.ADMIN,
    'hr manager': RolesConfig_1.RoleCode.ADMIN,
    'hr': RolesConfig_1.RoleCode.HR,
    'human resources': RolesConfig_1.RoleCode.HR,
    'hr officer': RolesConfig_1.RoleCode.HR,
    'accountant': RolesConfig_1.RoleCode.ACCOUNTANT,
    'senior accountant': RolesConfig_1.RoleCode.ACCOUNTANT,
    'account officer': RolesConfig_1.RoleCode.ACCOUNTANT,
    'finance officer': RolesConfig_1.RoleCode.ACCOUNTANT,
    'hod': RolesConfig_1.RoleCode.HOD,
    'head of department': RolesConfig_1.RoleCode.HOD,
    'administrative staff': RolesConfig_1.RoleCode.STAFF,
    'staff': RolesConfig_1.RoleCode.STAFF,
};
function resolveRoleForPosition(position) {
    if (!position)
        return RolesConfig_1.RoleCode.STAFF;
    return exports.POSITION_ROLE_MAP[position.trim().toLowerCase()] ?? RolesConfig_1.RoleCode.STAFF;
}
//# sourceMappingURL=PositionRoleMap.js.map