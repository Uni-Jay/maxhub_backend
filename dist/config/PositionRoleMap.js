"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSITION_ROLE_MAP = void 0;
exports.resolveRoleForPosition = resolveRoleForPosition;
const RolesConfig_1 = require("./RolesConfig");
exports.POSITION_ROLE_MAP = {
    'ceo': RolesConfig_1.RoleCode.SUPERADMIN,
    'chief executive officer': RolesConfig_1.RoleCode.SUPERADMIN,
    'manager': RolesConfig_1.RoleCode.ADMIN,
    'head of admin': RolesConfig_1.RoleCode.ADMIN,
    'hr': RolesConfig_1.RoleCode.HR,
    'human resources': RolesConfig_1.RoleCode.HR,
    'hr officer': RolesConfig_1.RoleCode.HR,
    'accountant': RolesConfig_1.RoleCode.STAFF,
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