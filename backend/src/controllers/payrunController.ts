import { Request, Response, NextFunction } from "express";
import { PayrunService } from "../services/payrunService.js";
import { sendSuccess } from "../utils/response.js";

export class PayrunController {
  static async createPayrun(req: Request, res: Response, next: NextFunction) {
    try {
      const payrun = await PayrunService.createPayrun(req.body, req.user?.id || "system");
      return sendSuccess(res, payrun, "Payrun created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  static async getPayruns(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PayrunService.getPayruns(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getPayrunById(req: Request, res: Response, next: NextFunction) {
    try {
      const payrun = await PayrunService.getPayrunById(req.params.id as string);
      return sendSuccess(res, payrun);
    } catch (error) {
      next(error);
    }
  }

  static async computePayrun(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PayrunService.computePayrun(req.params.id as string, req.user?.id);
      return sendSuccess(res, result, "Payrun computed successfully");
    } catch (error) {
      next(error);
    }
  }

  static async validatePayrun(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PayrunService.validatePayrun(req.params.id as string, req.user?.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async finalizePayrun(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PayrunService.finalizePayrun(req.params.id as string, req.user?.id || "system");
      return sendSuccess(res, result.payrun, result.message);
    } catch (error) {
      next(error);
    }
  }

  static async getPayrunPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const payslips = await PayrunService.getPayrunPayslips(req.params.id as string);
      return sendSuccess(res, payslips);
    } catch (error) {
      next(error);
    }
  }
}

export default PayrunController;
