import { Router, Request, Response } from 'express';
import { Designation } from '../models/Designation.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = Router();

router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { departmentId, status } = req.query;
  const where: Record<string, unknown> = {};
  if (departmentId) where.departmentId = BigInt(departmentId as string);
  if (status) where.status = status;

  const designations = await Designation.findAll({
    where,
    order: [['level', 'ASC'], ['name', 'ASC']],
    attributes: ['id', 'name', 'code', 'departmentId', 'level', 'status'],
  });
  ResponseFormatter.success(res, designations);
}));

router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const d = await Designation.findByPk(req.params.id);
  if (!d) return ResponseFormatter.notFound(res, 'Designation not found');
  ResponseFormatter.success(res, d);
}));

router.post('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name, code, departmentId, level, baseSalary, description } = req.body;
  const d = await Designation.create({
    name,
    code,
    departmentId: departmentId ? BigInt(departmentId) : undefined,
    level: level ?? 1,
    baseSalary,
    description,
    status: 'Active',
  });
  ResponseFormatter.success(res, d, 'Designation created', 201);
}));

router.patch('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const d = await Designation.findByPk(req.params.id);
  if (!d) return ResponseFormatter.notFound(res, 'Designation not found');
  await d.update(req.body);
  ResponseFormatter.success(res, d, 'Designation updated');
}));

router.delete('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const d = await Designation.findByPk(req.params.id);
  if (!d) return ResponseFormatter.notFound(res, 'Designation not found');
  await d.destroy();
  ResponseFormatter.success(res, null, 'Designation deleted');
}));

export default router;
