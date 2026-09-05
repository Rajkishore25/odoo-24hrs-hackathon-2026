import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboardService.js";
import { sendSuccess } from "../utils/response.js";

export class DashboardController {
  static async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const metrics = await DashboardService.getMetrics();
      return sendSuccess(res, metrics);
    } catch (error) {
      next(error);
    }
  }
}

export default DashboardController;
