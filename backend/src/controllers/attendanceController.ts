import { Request, Response, NextFunction } from "express";
import { AttendanceService } from "../services/attendanceService.js";
import { sendSuccess } from "../utils/response.js";

export class AttendanceController {
  public static async checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AttendanceService.checkIn(req.body.employeeId, req.user?.id);
      return sendSuccess(res, result.attendance, result.message);
    } catch (error) {
      next(error);
    }
  }

  public static async checkOut(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AttendanceService.checkOut(req.body.employeeId, req.user?.id);
      return sendSuccess(
        res,
        { attendance: result.attendance, exception: result.exception },
        result.message
      );
    } catch (error) {
      next(error);
    }
  }

  public static async getAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const { exceptionOnly, ...rest } = req.query as any;
      const result = await AttendanceService.getAttendanceRecords({
        ...rest,
        exceptionOnly: exceptionOnly === "true",
      });
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  public static async createAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const record = await AttendanceService.createAttendanceRecord(req.body, req.user?.id);
      return sendSuccess(res, record, "Attendance record saved successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  public static async getExceptions(req: Request, res: Response, next: NextFunction) {
    try {
      const exceptions = await AttendanceService.getExceptions(req.query as any);
      return sendSuccess(res, exceptions);
    } catch (error) {
      next(error);
    }
  }

  public static async reviewException(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, reason } = req.body;
      const updated = await AttendanceService.reviewException(
        req.params.id as string,
        status,
        reason,
        req.user?.id
      );
      return sendSuccess(res, updated, "Exception reviewed successfully");
    } catch (error) {
      next(error);
    }
  }
}
