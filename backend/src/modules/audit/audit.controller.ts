import { Request, Response, NextFunction } from 'express';
import * as auditService from './audit.service';
import { successResponse } from '../../utils/response';

export async function listAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await auditService.listAuditLogs(req.query as Record<string, string>);
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
}
