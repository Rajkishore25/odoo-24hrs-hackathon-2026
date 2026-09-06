import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';
import { successResponse } from '../../utils/response';

export async function getDashboard(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDashboard();
    return successResponse(res, data);
  } catch (err) {
    next(err);
  }
}
