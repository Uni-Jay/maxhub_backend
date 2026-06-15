import { Router, Request, Response } from 'express';
import { ResponseFormatter } from '@utils/ResponseFormatter';
import { ErrorMiddleware } from '@middleware/ErrorMiddleware';

export default Router()
  .get('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    ResponseFormatter.success(res, []);
  }))
  .post('/', ErrorMiddleware.asyncHandler(async (req: Request, res: Response) => {
    ResponseFormatter.success(res, {}, 'Created', 201);
  }));
