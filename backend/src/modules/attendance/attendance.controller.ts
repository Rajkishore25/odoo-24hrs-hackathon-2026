import { Request, Response, NextFunction } from 'express';
import * as attendanceService from './attendance.service';
import { successResponse } from '../../utils/response';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.checkIn(req.body.employeeId);
    return successResponse(res, result, 'Checked in successfully', 201);
  } catch (err) { next(err); }
}

export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.checkOut(req.body.employeeId);
    return successResponse(res, result, 'Checked out successfully');
  } catch (err) { next(err); }
}

export async function listAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.listAttendance(req.query as Record<string, string>);
    return successResponse(res, result);
  } catch (err) { next(err); }
}

export async function createAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.createAttendance(req.body);
    return successResponse(res, result, 'Attendance record created', 201);
  } catch (err) { next(err); }
}

export async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.updateAttendance(req.params.id, req.body);
    return successResponse(res, result);
  } catch (err) { next(err); }
}

export async function listExceptions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.listExceptions(req.query as Record<string, string>);
    return successResponse(res, result);
  } catch (err) { next(err); }
}

export async function updateException(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.updateException(req.params.id, req.body, req.user!.userId);
    return successResponse(res, result);
  } catch (err) { next(err); }
}
