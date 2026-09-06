import { Request, Response, NextFunction } from 'express';
import * as contractsService from './contracts.service';
import { successResponse } from '../../utils/response';

export async function getContractsByEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const contracts = await contractsService.getContractsByEmployee(req.params.employeeId);
    return successResponse(res, contracts);
  } catch (err) { next(err); }
}

export async function getContract(req: Request, res: Response, next: NextFunction) {
  try {
    const contract = await contractsService.getContract(req.params.id);
    return successResponse(res, contract);
  } catch (err) { next(err); }
}

export async function createContract(req: Request, res: Response, next: NextFunction) {
  try {
    const contract = await contractsService.createContract(req.body, req.user!.userId);
    return successResponse(res, contract, 'Contract created', 201);
  } catch (err) { next(err); }
}

export async function updateContract(req: Request, res: Response, next: NextFunction) {
  try {
    const contract = await contractsService.updateContract(req.params.id, req.body, req.user!.userId);
    return successResponse(res, contract);
  } catch (err) { next(err); }
}

export async function getApplicableContracts(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, periodStart, periodEnd } = req.query as Record<string, string>;
    const result = await contractsService.getApplicableContracts(
      employeeId,
      new Date(periodStart),
      new Date(periodEnd)
    );
    return successResponse(res, result);
  } catch (err) { next(err); }
}
