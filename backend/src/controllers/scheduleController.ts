import { Request, Response, NextFunction } from "express";
import { ScheduleService } from "../services/scheduleService.js";
import { sendSuccess } from "../utils/response.js";

export class ScheduleController {
  public static async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const schedules = await ScheduleService.getSchedules();
      return sendSuccess(res, schedules);
    } catch (error) {
      next(error);
    }
  }

  public static async getScheduleById(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.getScheduleById(req.params.id as string);
      return sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  }

  public static async createSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.createSchedule(req.body, req.user?.id);
      return sendSuccess(res, schedule, "Working schedule created successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async updateSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const schedule = await ScheduleService.updateSchedule(
        req.params.id as string,
        req.body,
        req.user?.id
      );
      return sendSuccess(res, schedule, "Working schedule updated successfully");
    } catch (error) {
      next(error);
    }
  }

  public static async getExpectedHours(req: Request, res: Response, next: NextFunction) {
    try {
      const { periodStart, periodEnd } = req.query as { periodStart: string; periodEnd: string };
      const result = await ScheduleService.getExpectedHours(
        req.params.id as string,
        periodStart,
        periodEnd
      );
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
