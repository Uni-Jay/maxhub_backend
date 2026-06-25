"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayLocalDate = todayLocalDate;
function todayLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
//# sourceMappingURL=dateUtils.js.map