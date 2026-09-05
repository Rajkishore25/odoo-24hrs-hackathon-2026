import prisma from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuditService } from "./auditService.js";
import { AttendanceStatus, ExceptionStatus, ExceptionType } from "@prisma/client";

export class AttendanceService {
  private static getUtcDateOnly(date: Date = new Date()): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  public static async checkIn(employeeId: string, actorId?: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new AppError("Employee not found", 404, "NOT_FOUND");
    }

    const today = this.getUtcDateOnly();
    const now = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (existing && existing.checkIn) {
      return {
        message: "Already checked in for today",
        attendance: existing,
      };
    }

    const attendance = existing
      ? await prisma.attendance.update({
          where: { id: existing.id },
          data: {
            checkIn: now,
            status: "PRESENT",
          },
        })
      : await prisma.attendance.create({
          data: {
            employeeId,
            date: today,
            checkIn: now,
            status: "PRESENT",
            workedHours: 0,
          },
        });

    return {
      message: "Check-in recorded successfully",
      attendance,
    };
  }

  public static async checkOut(employeeId: string, actorId?: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new AppError("Employee not found", 404, "NOT_FOUND");
    }

    const today = this.getUtcDateOnly();
    const now = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    // If no check-in exists for today, this is a missing punch exception!
    if (!existing || !existing.checkIn) {
      const attendance = existing
        ? await prisma.attendance.update({
            where: { id: existing.id },
            data: {
              checkOut: now,
              status: "MISSING_PUNCH",
              hasException: true,
            },
          })
        : await prisma.attendance.create({
            data: {
              employeeId,
              date: today,
              checkOut: now,
              status: "MISSING_PUNCH",
              hasException: true,
              workedHours: 0,
            },
          });

      const exception = await prisma.attendanceException.create({
        data: {
          employeeId,
          attendanceId: attendance.id,
          type: "MISSING_PUNCH",
          status: "OPEN",
          reason: "Check-out attempted without an earlier check-in",
        },
      });

      return {
        message: "Check-out recorded with missing punch exception",
        attendance,
        exception,
      };
    }

    // Calculate worked hours
    const diffMs = now.getTime() - existing.checkIn.getTime();
    const workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    let hasException = false;
    let exceptionReason = "";
    let exceptionType: ExceptionType = "OTHER";

    if (workedHours < 4) {
      hasException = true;
      exceptionType = "UNUSUAL_HOURS";
      exceptionReason = `Insufficient worked hours recorded (${workedHours} hrs)`;
    } else if (workedHours > 12) {
      hasException = true;
      exceptionType = "UNUSUAL_HOURS";
      exceptionReason = `Unusually long shift recorded (${workedHours} hrs)`;
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        workedHours,
        hasException: existing.hasException || hasException,
      },
    });

    let exceptionRecord = null;
    if (hasException) {
      exceptionRecord = await prisma.attendanceException.create({
        data: {
          employeeId,
          attendanceId: updated.id,
          type: exceptionType,
          status: "OPEN",
          reason: exceptionReason,
        },
      });
    }

    return {
      message: "Check-out recorded successfully",
      attendance: updated,
      exception: exceptionRecord,
    };
  }

  public static async getAttendanceRecords(filter: {
    employeeId?: string;
    from?: string;
    to?: string;
    status?: AttendanceStatus;
    exceptionOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.status) where.status = filter.status;
    if (filter.exceptionOnly) where.hasException = true;

    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) where.date.gte = new Date(filter.from);
      if (filter.to) where.date.lte = new Date(filter.to);
    }

    const [total, items] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          employee: {
            select: { id: true, employeeCode: true, name: true, department: true },
          },
          exceptions: true,
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async createAttendanceRecord(
    data: {
      employeeId: string;
      date: string;
      checkIn?: string | null;
      checkOut?: string | null;
      workedHours?: number;
      status?: AttendanceStatus;
    },
    actorId?: string
  ) {
    const recordDate = new Date(data.date);
    const checkIn = data.checkIn ? new Date(data.checkIn) : null;
    const checkOut = data.checkOut ? new Date(data.checkOut) : null;

    let computedHours = data.workedHours ?? 0;
    if (checkIn && checkOut && !data.workedHours) {
      computedHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: recordDate,
        },
      },
      update: {
        checkIn,
        checkOut,
        workedHours: computedHours,
        status: data.status || "PRESENT",
      },
      create: {
        employeeId: data.employeeId,
        date: recordDate,
        checkIn,
        checkOut,
        workedHours: computedHours,
        status: data.status || "PRESENT",
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "ATTENDANCE_RECORD_CREATED",
      entityType: "Attendance",
      entityId: record.id,
      newData: record,
      reason: "Manual attendance entry or update",
    });

    return record;
  }

  public static async getExceptions(filter: {
    status?: ExceptionStatus;
    employeeId?: string;
  }) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.employeeId) where.employeeId = filter.employeeId;

    return prisma.attendanceException.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: { id: true, employeeCode: true, name: true, department: true },
        },
        attendance: true,
        reviewer: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  public static async reviewException(
    exceptionId: string,
    status: ExceptionStatus,
    reason: string,
    reviewerId?: string
  ) {
    const exception = await prisma.attendanceException.findUnique({
      where: { id: exceptionId },
      include: { attendance: true },
    });

    if (!exception) {
      throw new AppError("Attendance exception not found", 404, "NOT_FOUND");
    }

    const updated = await prisma.attendanceException.update({
      where: { id: exceptionId },
      data: {
        status,
        reason,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    // If exception was corrected or dismissed, check if any open exceptions remain on this attendance
    const openExceptions = await prisma.attendanceException.count({
      where: {
        attendanceId: exception.attendanceId,
        status: "OPEN",
      },
    });

    if (openExceptions === 0) {
      await prisma.attendance.update({
        where: { id: exception.attendanceId },
        data: { hasException: false },
      });
    }

    await AuditService.log({
      userId: reviewerId,
      action: "ATTENDANCE_EXCEPTION_REVIEWED",
      entityType: "AttendanceException",
      entityId: exceptionId,
      oldData: exception,
      newData: updated,
      reason,
    });

    return updated;
  }
}
