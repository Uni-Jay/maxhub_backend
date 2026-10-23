"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const HolidayCalendar_model_1 = require("../models/HolidayCalendar.model");
const CalendarEvent_model_1 = require("../models/CalendarEvent.model");
const router = (0, express_1.Router)();
const NIGERIA_HOLIDAYS_2025 = [
    { code: 'NG-2025-01', name: "New Year's Day", date: '2025-01-01', type: 'National', desc: 'New Year public holiday' },
    { code: 'NG-2025-02', name: 'New Year Holiday', date: '2025-01-03', type: 'National', desc: 'New Year public holiday' },
    { code: 'NG-2025-03', name: "Workers' Day", date: '2025-05-01', type: 'National', desc: 'International Labour Day' },
    { code: 'NG-2025-04', name: 'Eid al-Fitr', date: '2025-03-31', type: 'Festival', desc: 'End of Ramadan (approx.)' },
    { code: 'NG-2025-05', name: 'Eid al-Adha', date: '2025-06-07', type: 'Festival', desc: 'Islamic festival (approx.)' },
    { code: 'NG-2025-06', name: 'Democracy Day', date: '2025-06-12', type: 'National', desc: 'Nigerian Democracy Day' },
    { code: 'NG-2025-07', name: 'Independence Day', date: '2025-10-01', type: 'National', desc: 'Nigerian Independence Day' },
    { code: 'NG-2025-08', name: "Maulid al-Nabi", date: '2025-09-05', type: 'Festival', desc: "Prophet's Birthday (approx.)" },
    { code: 'NG-2025-09', name: 'Christmas Day', date: '2025-12-25', type: 'National', desc: 'Christmas public holiday' },
    { code: 'NG-2025-10', name: 'Boxing Day', date: '2025-12-26', type: 'National', desc: 'Boxing Day public holiday' },
];
const NIGERIA_HOLIDAYS_2026 = [
    { code: 'NG-2026-01', name: "New Year's Day", date: '2026-01-01', type: 'National', desc: 'New Year public holiday' },
    { code: 'NG-2026-02', name: "Workers' Day", date: '2026-05-01', type: 'National', desc: 'International Labour Day' },
    { code: 'NG-2026-03', name: 'Eid al-Fitr', date: '2026-03-20', type: 'Festival', desc: 'End of Ramadan (approx.)' },
    { code: 'NG-2026-04', name: 'Eid al-Adha', date: '2026-05-27', type: 'Festival', desc: 'Islamic festival (approx.)' },
    { code: 'NG-2026-05', name: 'Democracy Day', date: '2026-06-12', type: 'National', desc: 'Nigerian Democracy Day' },
    { code: 'NG-2026-06', name: 'Independence Day', date: '2026-10-01', type: 'National', desc: 'Nigerian Independence Day' },
    { code: 'NG-2026-07', name: 'Christmas Day', date: '2026-12-25', type: 'National', desc: 'Christmas public holiday' },
    { code: 'NG-2026-08', name: 'Boxing Day', date: '2026-12-26', type: 'National', desc: 'Boxing Day public holiday' },
];
router.get('/holidays', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { year, type } = req.query;
    const where = {};
    if (year)
        where.year = Number(year);
    if (type)
        where.type = type;
    const holidays = await HolidayCalendar_model_1.HolidayCalendar.findAll({
        where,
        order: [['holidayDate', 'ASC']],
    });
    ResponseFormatter_1.ResponseFormatter.success(res, holidays, 'Holidays retrieved');
}));
router.post('/holidays/seed', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const createdById = user?.id ?? BigInt(1);
    const country = req.body.country ?? 'Nigeria';
    const all = [...NIGERIA_HOLIDAYS_2025, ...NIGERIA_HOLIDAYS_2026];
    let created = 0;
    let skipped = 0;
    for (const h of all) {
        const exists = await HolidayCalendar_model_1.HolidayCalendar.findOne({ where: { holidayCode: h.code } });
        if (exists) {
            skipped++;
            continue;
        }
        await HolidayCalendar_model_1.HolidayCalendar.create({
            uuid: (0, uuid_1.v4)(),
            holidayCode: h.code,
            holidayName: h.name,
            holidayDate: new Date(h.date),
            year: Number(h.date.split('-')[0]),
            type: h.type,
            isOptional: false,
            description: h.desc,
            createdById,
        });
        created++;
    }
    ResponseFormatter_1.ResponseFormatter.success(res, { created, skipped }, `${country} holidays seeded`);
}));
router.post('/holidays', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { holidayName, holidayDate, type, isOptional, description } = req.body;
    if (!holidayName || !holidayDate) {
        return ResponseFormatter_1.ResponseFormatter.error(res, 'holidayName and holidayDate are required', 400);
    }
    const d = new Date(holidayDate);
    const year = d.getFullYear();
    const code = `CUSTOM-${year}-${Date.now()}`;
    const holiday = await HolidayCalendar_model_1.HolidayCalendar.create({
        uuid: (0, uuid_1.v4)(),
        holidayCode: code,
        holidayName,
        holidayDate: d,
        year,
        type: type || 'Company',
        isOptional: isOptional ?? false,
        description,
        createdById: user?.id ?? BigInt(1),
    });
    ResponseFormatter_1.ResponseFormatter.success(res, holiday, 'Holiday created', 201);
}));
router.delete('/holidays/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const holiday = await HolidayCalendar_model_1.HolidayCalendar.findByPk(req.params.id);
    if (!holiday)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Holiday not found');
    await holiday.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Holiday deleted');
}));
router.get('/events', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const where = {};
    if (start)
        where.date = { [sequelize_1.Op.gte]: new Date(start) };
    if (end)
        where.date = { ...where.date, [sequelize_1.Op.lte]: new Date(end) };
    const events = await CalendarEvent_model_1.CalendarEvent.findAll({ where, order: [['date', 'ASC']] });
    ResponseFormatter_1.ResponseFormatter.success(res, events, 'Events retrieved');
}));
router.post('/events', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { title, date, endDate, type, description, attendees } = req.body;
    if (!title || !date)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title and date are required', 400);
    const event = await CalendarEvent_model_1.CalendarEvent.create({
        uuid: (0, uuid_1.v4)(),
        title,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : undefined,
        type: type || 'Meeting',
        description,
        attendees,
        createdById: user?.id,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, event, 'Event created', 201);
}));
router.put('/events/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const event = await CalendarEvent_model_1.CalendarEvent.findByPk(req.params.id);
    if (!event)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Event not found');
    const { title, date, endDate, type, description, attendees } = req.body;
    await event.update({
        title: title ?? event.title,
        date: date ? new Date(date) : event.date,
        endDate: endDate ? new Date(endDate) : event.endDate,
        type: type ?? event.type,
        description: description ?? event.description,
        attendees: attendees ?? event.attendees,
    });
    ResponseFormatter_1.ResponseFormatter.success(res, event, 'Event updated');
}));
router.delete('/events/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const event = await CalendarEvent_model_1.CalendarEvent.findByPk(req.params.id);
    if (!event)
        return ResponseFormatter_1.ResponseFormatter.notFound(res, 'Event not found');
    await event.destroy();
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Event deleted');
}));
exports.default = router;
//# sourceMappingURL=calendar.routes.js.map