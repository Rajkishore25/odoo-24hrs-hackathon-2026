import { Request, Response, NextFunction } from "express";
import { PayslipService } from "../services/payslipService.js";
import { sendSuccess } from "../utils/response.js";

export class PayslipController {
  static async getPayslipById(req: Request, res: Response, next: NextFunction) {
    try {
      const payslip = await PayslipService.getPayslipById(req.params.id as string);
      return sendSuccess(res, payslip);
    } catch (error) {
      next(error);
    }
  }

  static async getPayslipPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const html = await PayslipService.getPayslipHtml(req.params.id as string);
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    } catch (error) {
      next(error);
    }
  }
}

export default PayslipController;
