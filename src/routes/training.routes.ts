import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import { idOrUuidWhere } from '@utils/idOrUuid';
import { v4 as uuidv4 } from 'uuid';
import { TrainingProgram } from '@models/TrainingProgram.model';
import { TrainingAttendance } from '@models/TrainingAttendance.model';
import { Staff } from '@models/Staff.model';
import { User } from '@models/User.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';
import AuthMiddleware from '@middleware/AuthMiddleware';

const router = Router();

// GET /api/training
router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 12, status, trainingType, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const where: any = {};
  if (status) where.status = status;
  if (trainingType) where.trainingType = trainingType;
  if (search) where.trainingName = { [Op.iLike]: `%${search}%` };

  const { count, rows } = await TrainingProgram.findAndCountAll({
    where, order: [['startDate', 'DESC']], limit: Number(limit), offset,
  });
  ResponseFormatter.paginated(res, rows, count, Number(page), Number(limit));
}));

// GET /api/training/stats/overview
router.get('/stats/overview', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const [total, active, completed] = await Promise.all([
    TrainingProgram.count(),
    TrainingProgram.count({ where: { status: 'Active' } }),
    TrainingProgram.count({ where: { status: 'Completed' } }),
  ]);

  const budgetResult = await TrainingProgram.findAll({ attributes: ['budget'] });
  const totalBudget = budgetResult.reduce((sum: number, t: any) => sum + Number(t.budget || 0), 0);

  ResponseFormatter.success(res, { total, active, completed, totalBudget });
}));

// GET /api/training/:id
router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const program = await TrainingProgram.findOne({
    where: { ...idOrUuidWhere(req.params.id) },
  });
  if (!program) return ResponseFormatter.error(res, 'Training program not found', 404);

  const [presentCount, absentCount, lateCount] = await Promise.all([
    TrainingAttendance.count({ where: { trainingProgramId: (program as any).id, status: 'Present' } }),
    TrainingAttendance.count({ where: { trainingProgramId: (program as any).id, status: 'Absent' } }),
    TrainingAttendance.count({ where: { trainingProgramId: (program as any).id, status: 'Late' } }),
  ]);

  ResponseFormatter.success(res, { ...program.toJSON(), attendanceSummary: { present: presentCount, absent: absentCount, late: lateCount } });
}));

// POST /api/training
router.post('/', AuthMiddleware.requirePermission('HR.TRAINING.CREATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { trainingName, trainingType, duration, durationUnit, startDate, endDate,
    description, provider, location, budget } = req.body;

  if (!trainingName || !trainingType || !duration || !durationUnit || !startDate || !endDate) {
    return ResponseFormatter.error(res, 'trainingName, trainingType, duration, durationUnit, startDate, endDate are required', 400);
  }

  const count = await TrainingProgram.count();
  const trainingCode = `TRN-${String(count + 1).padStart(6, '0')}`;

  const program = await TrainingProgram.create({
    uuid: uuidv4(), trainingCode, trainingName, trainingType, duration, durationUnit,
    startDate, endDate, description, provider, location, budget,
    status: 'Draft', createdById: (req as any).user.id,
  } as any);
  ResponseFormatter.success(res, program, 'Training program created', 201);
}));

// PUT /api/training/:id
router.put('/:id', AuthMiddleware.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const program = await TrainingProgram.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!program) return ResponseFormatter.error(res, 'Training program not found', 404);

  const allowed = ['trainingName', 'description', 'trainingType', 'duration', 'durationUnit', 'provider', 'location', 'startDate', 'endDate', 'budget'];
  const updates: any = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  await program.update(updates);
  ResponseFormatter.success(res, program, 'Training program updated');
}));

// PATCH /api/training/:id/status
router.patch('/:id/status', AuthMiddleware.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const program = await TrainingProgram.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!program) return ResponseFormatter.error(res, 'Training program not found', 404);

  const { status } = req.body;
  const current = (program as any).status;
  const validTransitions: Record<string, string[]> = {
    Draft: ['Active', 'Cancelled'],
    Active: ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
  };

  if (!validTransitions[current]?.includes(status)) {
    return ResponseFormatter.error(res, `Cannot transition from ${current} to ${status}`, 400);
  }

  await program.update({ status });
  ResponseFormatter.success(res, program, 'Status updated');
}));

// DELETE /api/training/:id
router.delete('/:id', AuthMiddleware.requirePermission('HR.TRAINING.DELETE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const program = await TrainingProgram.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!program) return ResponseFormatter.error(res, 'Training program not found', 404);
  await program.destroy();
  ResponseFormatter.success(res, null, 'Training program deleted');
}));

// GET /api/training/:id/attendance
router.get('/:id/attendance', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const program = await TrainingProgram.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!program) return ResponseFormatter.error(res, 'Training program not found', 404);

  const attendance = await TrainingAttendance.findAll({
    where: { trainingProgramId: (program as any).id },
    include: [{ model: Staff, as: 'staff', include: [{ model: User, attributes: ['firstName', 'lastName'] }] }],
    order: [['attendanceDate', 'DESC']],
  });
  ResponseFormatter.success(res, attendance);
}));

// POST /api/training/:id/attendance
router.post('/:id/attendance', AuthMiddleware.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const program = await TrainingProgram.findOne({ where: { ...idOrUuidWhere(req.params.id) } });
  if (!program) return ResponseFormatter.error(res, 'Training program not found', 404);

  const { staffId, attendanceDate, status, notes } = req.body;
  if (!staffId || !attendanceDate || !status) {
    return ResponseFormatter.error(res, 'staffId, attendanceDate, status are required', 400);
  }

  const [record, created] = await (TrainingAttendance as any).findOrCreate({
    where: { trainingProgramId: (program as any).id, staffId, attendanceDate },
    defaults: { trainingProgramId: (program as any).id, staffId, attendanceDate, status, notes },
  });

  if (!created) await record.update({ status, notes });

  ResponseFormatter.success(res, record, created ? 'Attendance recorded' : 'Attendance updated', created ? 201 : 200);
}));

// PUT /api/training/:id/attendance/:attendanceId
router.put('/:id/attendance/:attendanceId', AuthMiddleware.requirePermission('HR.TRAINING.UPDATE.ALL'), ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const record = await TrainingAttendance.findByPk(req.params.attendanceId);
  if (!record) return ResponseFormatter.error(res, 'Attendance record not found', 404);

  const { status, notes } = req.body;
  await (record as any).update({ status, notes });
  ResponseFormatter.success(res, record, 'Attendance updated');
}));

export default router;
