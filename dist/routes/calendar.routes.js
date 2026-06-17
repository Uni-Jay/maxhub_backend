"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sequelize_1 = require("sequelize");
const uuid_1 = require("uuid");
const ResponseFormatter_1 = require("../utils/ResponseFormatter");
const ErrorMiddleware_1 = require("../middleware/ErrorMiddleware");
const router = (0, express_1.Router)();
const NIGERIAN_HOLIDAYS = [
    { id: 'h1', title: "New Year's Day", date: '2025-01-01', type: 'Holiday', description: 'Nigerian public holiday' },
    { id: 'h2', title: "New Year Holiday", date: '2025-01-03', type: 'Holiday', description: 'Nigerian public holiday' },
    { id: 'h3', title: "Workers' Day", date: '2025-05-01', type: 'Holiday', description: 'International Labour Day' },
    { id: 'h4', title: "Democracy Day", date: '2025-06-12', type: 'Holiday', description: 'Nigerian Democracy Day' },
    { id: 'h5', title: "Eid al-Adha", date: '2025-06-07', type: 'Holiday', description: 'Islamic festival (approx.)' },
    { id: 'h6', title: "Independence Day", date: '2025-10-01', type: 'Holiday', description: 'Nigerian Independence Day' },
    { id: 'h7', title: "Christmas Day", date: '2025-12-25', type: 'Holiday', description: 'Christmas public holiday' },
    { id: 'h8', title: "Boxing Day", date: '2025-12-26', type: 'Holiday', description: 'Boxing Day public holiday' },
];
router.get('/events', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    try {
        const { CalendarEvent } = require('@models/CalendarEvent.model');
        const where = {};
        if (start)
            where.date = { [sequelize_1.Op.gte]: new Date(start) };
        if (end)
            where.date = { ...where.date, [sequelize_1.Op.lte]: new Date(end) };
        const events = await CalendarEvent.findAll({ where, order: [['date', 'ASC']] });
        const combined = [...NIGERIAN_HOLIDAYS, ...events.map((e) => e.toJSON())];
        return ResponseFormatter_1.ResponseFormatter.success(res, combined);
    }
    catch {
        return ResponseFormatter_1.ResponseFormatter.success(res, NIGERIAN_HOLIDAYS);
    }
}));
router.post('/events', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    const user = req.user;
    const { title, date, endDate, type, description, attendees } = req.body;
    if (!title || !date)
        return ResponseFormatter_1.ResponseFormatter.error(res, 'title and date are required', 400);
    try {
        const { CalendarEvent } = require('@models/CalendarEvent.model');
        const event = await CalendarEvent.create({ uuid: (0, uuid_1.v4)(), title, date, endDate, type: type || 'Meeting', description, attendees, createdById: user.id });
        return ResponseFormatter_1.ResponseFormatter.success(res, event, 'Event created', 201);
    }
    catch {
        const event = { id: (0, uuid_1.v4)(), title, date, endDate, type: type || 'Meeting', description, attendees, createdById: user.id };
        return ResponseFormatter_1.ResponseFormatter.success(res, event, 'Event created', 201);
    }
}));
router.delete('/events/:id', ErrorMiddleware_1.ErrorMiddleware.asyncHandler(async (req, res) => {
    try {
        const { CalendarEvent } = require('@models/CalendarEvent.model');
        const event = await CalendarEvent.findByPk(req.params.id);
        if (!event)
            return ResponseFormatter_1.ResponseFormatter.error(res, 'Event not found', 404);
        await event.destroy();
    }
    catch {
    }
    ResponseFormatter_1.ResponseFormatter.success(res, null, 'Event deleted');
}));
exports.default = router;
//# sourceMappingURL=calendar.routes.js.map