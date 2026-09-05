import { Request, Response, NextFunction } from "express";
import { ContractService } from "../services/contractService.js";
import { sendSuccess } from "../utils/response.js";

export class ContractController {
  public static async getContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const contracts = await ContractService.getContracts(req.query as any);
      return sendSuccess(res, contracts);
    } catch (error) {
      next(error);
    }
  }

  public static async getContractsByEmployeeId(req: Request, res: Response, next: NextFunction) {
    try {
      const contracts = await ContractService.getContractsByEmployeeId(req.params.employeeId as string);
      return sendSuccess(res, contracts);
    } catch (error) {
      next(error);
    }
  }

  public static async getContractById(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await ContractService.getContractById(req.params.id as string);
      return sendSuccess(res, contract);
    } catch (error) {
      next(error);
    }
  }

  public static async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await ContractService.createContract(req.body, req.user?.id);
      return sendSuccess(res, contract, "Contract created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async updateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const contract = await ContractService.updateContract(
        req.params.id as string,
        req.body,
        req.user?.id
      );
      return sendSuccess(res, contract, "Contract updated successfully");
    } catch (error) {
      next(error);
    }
  }

  public static async getApplicableContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId, periodStart, periodEnd } = req.query as {
        employeeId: string;
        periodStart: string;
        periodEnd: string;
      };

      const result = await ContractService.getApplicableContracts(employeeId, periodStart, periodEnd);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
