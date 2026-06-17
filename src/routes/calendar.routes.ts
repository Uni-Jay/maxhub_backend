// @ts-nocheck
import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import { HolidayCalendar } from '@models/HolidayCalendar.model';
import { CalendarEvent } from '@models/CalendarEvent.model';

const router = Router();

// Nigeria public holidays seed data
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

// GET /api/calendar/holidays
router.get('/holidays', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { year, type } = req.query;
  const where: any = {};
  if (year) where.year = Number(year);
  if (type) where.type = type;

  const holidays = await HolidayCalendar.findAll({
    where,
    order: [['holidayDate', 'ASC']],
  });

  ResponseFormatter.success(res, holidays, 'Holidays retrieved');
}));

// POST /api/calendar/holidays/seed — seeds Nigeria holidays for 2025 & 2026
router.post('/holidays/seed', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const createdById = user?.id ?? BigInt(1);
  const country = req.body.country ?? 'Nigeria';
  const all = [...NIGERIA_HOLIDAYS_2025, ...NIGERIA_HOLIDAYS_2026];
  let created = 0;
  let skipped = 0;

  for (const h of all) {
    const exists = await HolidayCalendar.findOne({ where: { holidayCode: h.code } });
    if (exists) { skipped++; continue; }
    await HolidayCalendar.create({
      uuid: uuidv4(),
      holidayCode: h.code,
      holidayName: h.name,
      holidayDate: new Date(h.date),
      year: Number(h.date.split('-')[0]),
      type: h.type as any,
      isOptional: false,
      description: h.desc,
      createdById,
    } as any);
    created++;
  }

  ResponseFormatter.success(res, { created, skipped }, `${country} holidays seeded`);
}));

// POST /api/calendar/holidays — create a single holiday
router.post('/holidays', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { holidayName, holidayDate, type, isOptional, description } = req.body;
  if (!holidayName || !holidayDate) {
    return ResponseFormatter.error(res, 'holidayName and holidayDate are required', 400);
  }
  const d = new Date(holidayDate);
  const year = d.getFullYear();
  const code = `CUSTOM-${year}-${Date.now()}`;

  const holiday = await HolidayCalendar.create({
    uuid: uuidv4(),
    holidayCode: code,
    holidayName,
    holidayDate: d,
    year,
    type: type || 'Company',
    isOptional: isOptional ?? false,
    description,
    createdById: user?.id ?? BigInt(1),
  } as any);

  ResponseFormatter.success(res, holiday, 'Holiday created', 201);
}));

// DELETE /api/calendar/holidays/:id
router.delete('/holidays/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const holiday = await HolidayCalendar.findByPk(req.params.id);
  if (!holiday) return ResponseFormatter.notFound(res, 'Holiday not found');
  await holiday.destroy();
  ResponseFormatter.success(res, null, 'Holiday deleted');
}));

// GET /api/calendar/events
router.get('/events', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const where: any = {};
  if (start) where.date = { [Op.gte]: new Date(start as string) };
  if (end) where.date = { ...where.date, [Op.lte]: new Date(end as string) };

  const events = await CalendarEvent.findAll({ where, order: [['date', 'ASC']] });
  ResponseFormatter.success(res, events, 'Events retrieved');
}));

// POST /api/calendar/events
router.post('/events', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { title, date, endDate, type, description, attendees } = req.body;
  if (!title || !date) return ResponseFormatter.error(res, 'title and date are required', 400);

  const event = await CalendarEvent.create({
    uuid: uuidv4(),
    title,
    date: new Date(date),
    endDate: endDate ? new Date(endDate) : undefined,
    type: type || 'Meeting',
    description,
    attendees,
    createdById: user?.id,
  } as any);

  ResponseFormatter.success(res, event, 'Event created', 201);
}));

// PUT /api/calendar/events/:id
router.put('/events/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const event = await CalendarEvent.findByPk(req.params.id);
  if (!event) return ResponseFormatter.notFound(res, 'Event not found');

  const { title, date, endDate, type, description, attendees } = req.body;
  await event.update({
    title: title ?? event.title,
    date: date ? new Date(date) : event.date,
    endDate: endDate ? new Date(endDate) : event.endDate,
    type: type ?? event.type,
    description: description ?? event.description,
    attendees: attendees ?? event.attendees,
  });

  ResponseFormatter.success(res, event, 'Event updated');
}));

// DELETE /api/calendar/events/:id
router.delete('/events/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const event = await CalendarEvent.findByPk(req.params.id);
  if (!event) return ResponseFormatter.notFound(res, 'Event not found');
  await event.destroy();
  ResponseFormatter.success(res, null, 'Event deleted');
}));

export default router;
