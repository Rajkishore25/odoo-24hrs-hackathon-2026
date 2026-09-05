import { Request, Response, NextFunction } from "express";
import { TimeOffService } from "../services/timeOffService.js";
import { sendSuccess } from "../utils/response.js";

export class TimeOffController {
  public static async getTimeOffTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = await TimeOffService.getTimeOffTypes();
      return sendSuccess(res, types);
    } catch (error) {
      next(error);
    }
  }

  public static async createTimeOffType(req: Request, res: Response, next: NextFunction) {
    try {
      const type = await TimeOffService.createTimeOffType(req.body, req.user?.id);
      return sendSuccess(res, type, "Time-off type created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { employeeId } = req.query as { employeeId?: string };
      const allocations = await TimeOffService.getAllocations(employeeId);
      return sendSuccess(res, allocations);
    } catch (error) {
      next(error);
    }
  }

  public static async createAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await TimeOffService.createAllocation(req.body, req.user?.id);
      return sendSuccess(res, allocation, "Leave allocated successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getTimeOffBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const balance = await TimeOffService.getTimeOffBalance(req.params.employeeId as string);
      return sendSuccess(res, balance);
    } catch (error) {
      next(error);
    }
  }

  public static async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await TimeOffService.getRequests(req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await TimeOffService.createRequest(req.body, req.user?.id);
      return sendSuccess(res, request, "Time off request submitted successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async approveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await TimeOffService.approveRequest(req.params.id as string, req.user?.id);
      return sendSuccess(res, request, "Time off request approved");
    } catch (error) {
      next(error);
    }
  }

  public static async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { reason } = req.body;
      const request = await TimeOffService.rejectRequest(
        req.params.id as string,
        reason,
        req.user?.id
      );
      return sendSuccess(res, request, "Time off request rejected");
    } catch (error) {
      next(error);
    }
  }
}
