import { Request, Response, NextFunction } from 'express';
import * as timeoffService from './timeoff.service';
import { successResponse } from '../../utils/response';

// ── Types
export async function listTypes(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await timeoffService.listTypes()); } catch (e) { next(e); }
}
export async function createType(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await timeoffService.createType(req.body), 'Leave type created', 201); } catch (e) { next(e); }
}

// ── Allocations
export async function listAllocations(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await timeoffService.listAllocations(req.query.employeeId as string)); } catch (e) { next(e); }
}
export async function createAllocation(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await timeoffService.createAllocation(req.body), 'Allocation created', 201); } catch (e) { next(e); }
}

// ── Requests
export async function listRequests(req: Request, res: Response, next: NextFunction) {
  try {
    // Pass requester role so service can filter out HR leave from non-admins
    const query = {
      ...(req.query as Record<string, string>),
      requesterRole: req.user!.role,
    };
    return successResponse(res, await timeoffService.listRequests(query));
  } catch (e) { next(e); }
}
export async function createRequest(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await timeoffService.createRequest(req.body), 'Leave request submitted', 201); } catch (e) { next(e); }
}
export async function approveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    return successResponse(res, await timeoffService.approveRequest(
      req.params.id,
      req.user!.userId,
      req.user!.role,
    ));
  } catch (e) { next(e); }
}
export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    return successResponse(res, await timeoffService.rejectRequest(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body.reason,
    ));
  } catch (e) { next(e); }
}

// ── Balance
export async function getBalance(req: Request, res: Response, next: NextFunction) {
  try { return successResponse(res, await timeoffService.getBalanceByEmployee(req.params.employeeId)); } catch (e) { next(e); }
}
