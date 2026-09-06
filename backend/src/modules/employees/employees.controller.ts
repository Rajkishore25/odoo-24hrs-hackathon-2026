import { Request, Response, NextFunction } from 'express';
import * as employeesService from './employees.service';
import { successResponse } from '../../utils/response';

export async function listEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await employeesService.listEmployees(req.query as Record<string, string>);
    return successResponse(res, result);
  } catch (err) { next(err); }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeesService.getEmployee(req.params.id);
    return successResponse(res, employee);
  } catch (err) { next(err); }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeesService.createEmployee(req.body, req.user!.userId);
    return successResponse(res, employee, 'Employee created', 201);
  } catch (err) { next(err); }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeesService.updateEmployee(req.params.id, req.body, req.user!.userId);
    return successResponse(res, employee);
  } catch (err) { next(err); }
}

export async function archiveEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeesService.archiveEmployee(req.params.id, req.user!.userId);
    return successResponse(res, employee);
  } catch (err) { next(err); }
}
