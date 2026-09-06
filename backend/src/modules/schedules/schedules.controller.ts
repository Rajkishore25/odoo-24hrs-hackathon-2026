import { Request, Response, NextFunction } from 'express';
import * as schedulesService from './schedules.service';
import { successResponse } from '../../utils/response';

export async function listSchedules(req: Request, res: Response, next: NextFunction) {
  try {
    const schedules = await schedulesService.listSchedules();
    return successResponse(res, schedules);
  } catch (err) { next(err); }
}

export async function getSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await schedulesService.getSchedule(req.params.id);
    return successResponse(res, schedule);
  } catch (err) { next(err); }
}

export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await schedulesService.createSchedule(req.body);
    return successResponse(res, schedule, 'Schedule created', 201);
  } catch (err) { next(err); }
}

export async function updateSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await schedulesService.updateSchedule(req.params.id, req.body);
    return successResponse(res, schedule);
  } catch (err) { next(err); }
}

export async function getExpectedHours(req: Request, res: Response, next: NextFunction) {
  try {
    const { periodStart, periodEnd } = req.query as Record<string, string>;
    const result = await schedulesService.getExpectedHours(
      req.params.id,
      new Date(periodStart),
      new Date(periodEnd)
    );
    return successResponse(res, result);
  } catch (err) { next(err); }
}
