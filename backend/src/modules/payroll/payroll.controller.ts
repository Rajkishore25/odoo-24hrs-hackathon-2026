import { Request, Response, NextFunction } from 'express';
import * as payrollService from './payroll.service';
import { successResponse } from '../../utils/response';

export async function listPayruns(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await payrollService.listPayruns(req.query as Record<string, string>)); } catch (e) { next(e); }
}

export async function getPayrun(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await payrollService.getPayrun(req.params.id)); } catch (e) { next(e); }
}

export async function createPayrun(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await payrollService.createPayrun(req.body, req.user!.userId), 'Payrun created', 201); } catch (e) { next(e); }
}

export async function computePayrun(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await payrollService.computePayrun(req.params.id, req.user!.userId), 'Payrun computed'); } catch (e) { next(e); }
}

export async function validatePayrun(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await payrollService.validatePayrunRoute(req.params.id)); } catch (e) { next(e); }
}

export async function finalizePayrun(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await payrollService.finalizePayrun(req.params.id, req.user!.userId), 'Payrun finalized'); } catch (e) { next(e); }
}

export async function getPayrunPayslips(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await payrollService.getPayrunPayslips(req.params.id)); } catch (e) { next(e); }
}

export async function deletePayrun(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await payrollService.deletePayrun(req.params.id, req.user!.userId);
    return successResponse(res, result, 'Payrun deleted');
  } catch (e) { next(e); }
}
