import { Router, Request, Response } from 'express';
import { Department } from '../models/Department.model';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

const router = Router();

router.get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const departments = await Department.findAll({
    where,
    order: [['name', 'ASC']],
    attributes: ['id', 'name', 'code', 'status', 'parentDepartmentId'],
  });
  ResponseFormatter.success(res, departments);
}));

router.get('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return ResponseFormatter.notFound(res, 'Department not found');
  ResponseFormatter.success(res, dept);
}));

router.post('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const { name, code, parentDepartmentId, headUserId } = req.body;
  const dept = await Department.create({
    name,
    code: code ?? name.toUpperCase().replace(/\s+/g, '_').slice(0, 10),
    parentDepartmentId: parentDepartmentId ? BigInt(parentDepartmentId) : undefined,
    headUserId: headUserId ? BigInt(headUserId) : undefined,
    status: 'Active',
  });
  ResponseFormatter.success(res, dept, 'Department created', 201);
}));

router.patch('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return ResponseFormatter.notFound(res, 'Department not found');
  await dept.update(req.body);
  ResponseFormatter.success(res, dept, 'Department updated');
}));

router.delete('/:id', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
  const dept = await Department.findByPk(req.params.id);
  if (!dept) return ResponseFormatter.notFound(res, 'Department not found');
  await dept.destroy();
  ResponseFormatter.success(res, null, 'Department deleted');
}));

export default router;
