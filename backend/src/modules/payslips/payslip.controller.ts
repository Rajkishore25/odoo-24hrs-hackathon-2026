import { Request, Response, NextFunction } from 'express';
import * as payslipService from './payslip.service';
import { successResponse } from '../../utils/response';
import { NotFoundError } from '../../utils/errors';
import fs from 'fs';

export async function getPayslip(req: Request, res: Response, next: NextFunction) {
  try {
    const payslip = await payslipService.getPayslip(req.params.id, req.user!.userId, req.user!.role);
    return successResponse(res, payslip);
  } catch (e) { next(e); }
}

export async function listPayslipsForEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const payslips = await payslipService.listPayslipsForEmployee(req.params.employeeId, req.user!.userId, req.user!.role);
    return successResponse(res, payslips);
  } catch (e) { next(e); }
}

export async function downloadPayslipPdf(req: Request, res: Response, next: NextFunction) {
  try {
    const pdfPath = await payslipService.getPayslipPdf(req.params.id, req.user!.userId, req.user!.role);
    if (!pdfPath || !fs.existsSync(pdfPath)) throw new NotFoundError('PDF file');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${req.params.id}.pdf"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (e) { next(e); }
}

export async function updatePayslip(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await payslipService.updatePayslip(req.params.id, req.body, req.user!.userId, req.user!.role);
    return successResponse(res, updated, 'Payslip updated');
  } catch (e) { next(e); }
}

export async function deletePayslip(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await payslipService.deletePayslip(req.params.id, req.user!.userId, req.user!.role);
    return successResponse(res, result, 'Payslip deleted');
  } catch (e) { next(e); }
}
