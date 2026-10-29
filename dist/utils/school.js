"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHOOL_DEPARTMENT_CODES = void 0;
exports.normaliseSchool = normaliseSchool;
exports.schoolDepartmentIds = schoolDepartmentIds;
exports.schoolOfDepartment = schoolOfDepartment;
exports.schoolDefaultDepartmentId = schoolDefaultDepartmentId;
const sequelize_1 = require("sequelize");
const Database_1 = __importDefault(require("../config/Database"));
exports.SCHOOL_DEPARTMENT_CODES = {
    KS: ['KS', 'KS-TRN'],
    BM: ['BM', 'BM-VOC'],
};
function normaliseSchool(v) {
    const s = String(v || '').toUpperCase().split('-')[0];
    return s === 'KS' || s === 'BM' ? s : null;
}
async function schoolDepartmentIds(school) {
    const s = normaliseSchool(school);
    if (!s)
        return null;
    const rows = await Database_1.default.query(`SELECT id FROM departments WHERE UPPER(code) IN (:codes) AND "deletedAt" IS NULL`, { replacements: { codes: exports.SCHOOL_DEPARTMENT_CODES[s] }, type: sequelize_1.QueryTypes.SELECT });
    return rows.map((r) => Number(r.id));
}
async function schoolOfDepartment(departmentId) {
    if (!departmentId)
        return null;
    const rows = await Database_1.default.query(`SELECT d.code, p.code AS parent FROM departments d LEFT JOIN departments p ON p.id = d."parentDepartmentId" WHERE d.id = :id`, { replacements: { id: departmentId }, type: sequelize_1.QueryTypes.SELECT });
    const code = String(rows[0]?.parent || rows[0]?.code || '').toUpperCase();
    return normaliseSchool(code);
}
async function schoolDefaultDepartmentId(school) {
    const s = normaliseSchool(school);
    if (!s)
        return null;
    const rows = await Database_1.default.query(`SELECT id, code FROM departments WHERE UPPER(code) IN (:codes) AND "deletedAt" IS NULL`, { replacements: { codes: exports.SCHOOL_DEPARTMENT_CODES[s] }, type: sequelize_1.QueryTypes.SELECT });
    const division = rows.find((r) => String(r.code).includes('-'));
    return Number((division || rows[0])?.id) || null;
}
//# sourceMappingURL=school.js.map