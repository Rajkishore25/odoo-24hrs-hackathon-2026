import { Request, Response, NextFunction } from 'express';
import * as salaryService from './salary.service';
import { successResponse } from '../../utils/response';

export async function listStructures(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await salaryService.listStructures()); } catch (e) { next(e); }
}
export async function getStructure(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await salaryService.getStructure(req.params.id)); } catch (e) { next(e); }
}
export async function createStructure(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await salaryService.createStructure(req.body, req.user!.userId), 'Structure created', 201); } catch (e) { next(e); }
}
export async function updateStructure(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await salaryService.updateStructure(req.params.id, req.body, req.user!.userId)); } catch (e) { next(e); }
}

export async function listRules(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await salaryService.listRules(req.query.structureId as string)); } catch (e) { next(e); }
}
export async function createRule(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await salaryService.createRule(req.body, req.user!.userId), 'Rule created', 201); } catch (e) { next(e); }
}
export async function updateRule(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await salaryService.updateRule(req.params.id, req.body, req.user!.userId)); } catch (e) { next(e); }
}
