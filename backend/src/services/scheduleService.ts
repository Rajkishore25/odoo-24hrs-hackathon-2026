import prisma from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuditService } from "./auditService.js";

const DAY_MAP: Record<number, string> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT",
};

export class ScheduleService {
  public static async getSchedules() {
    return prisma.workingSchedule.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  public static async getScheduleById(id: string) {
    const schedule = await prisma.workingSchedule.findUnique({
      where: { id },
    });
    if (!schedule) {
      throw new AppError("Working schedule not found", 404, "NOT_FOUND");
    }
    return schedule;
  }

  public static async createSchedule(
    data: {
      name: string;
      startTime: string;
      endTime: string;
      breakMinutes?: number;
      workingDays: string[];
    },
    actorId?: string
  ) {
    const schedule = await prisma.workingSchedule.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes ?? 0,
        workingDays: data.workingDays,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "SCHEDULE_CREATED",
      entityType: "WorkingSchedule",
      entityId: schedule.id,
      newData: schedule,
      reason: "Working schedule created",
    });

    return schedule;
  }

  public static async updateSchedule(
    id: string,
    data: Partial<{
      name: string;
      startTime: string;
      endTime: string;
      breakMinutes: number;
      workingDays: string[];
      isActive: boolean;
    }>,
    actorId?: string
  ) {
    const existing = await this.getScheduleById(id);

    const updated = await prisma.workingSchedule.update({
      where: { id },
      data,
    });

    await AuditService.log({
      userId: actorId,
      action: "SCHEDULE_UPDATED",
      entityType: "WorkingSchedule",
      entityId: id,
      oldData: existing,
      newData: updated,
      reason: "Working schedule updated",
    });

    return updated;
  }

  public static calculateExpectedHoursForSchedule(
    schedule: {
      startTime: string;
      endTime: string;
      breakMinutes: number;
      workingDays: any;
    },
    periodStart: string | Date,
    periodEnd: string | Date
  ) {
    const [startH, startM] = schedule.startTime.split(":").map(Number);
    const [endH, endM] = schedule.endTime.split(":").map(Number);

    const totalMinutesPerDay = endH * 60 + endM - (startH * 60 + startM);
    const netDailyHours = Math.max(0, (totalMinutesPerDay - schedule.breakMinutes) / 60);

    const workingDaysSet = new Set(
      Array.isArray(schedule.workingDays)
        ? schedule.workingDays
        : JSON.parse(schedule.workingDays as string)
    );

    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    if (start > end) {
      throw new AppError("periodStart cannot be after periodEnd", 400, "INVALID_DATE_RANGE");
    }

    let scheduledDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayName = DAY_MAP[current.getUTCDay()];
      if (workingDaysSet.has(dayName)) {
        scheduledDays++;
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const expectedHours = scheduledDays * netDailyHours;

    return {
      scheduledDays,
      expectedHours: Math.round(expectedHours * 100) / 100,
    };
  }

  public static async getExpectedHours(
    scheduleId: string,
    periodStart: string,
    periodEnd: string
  ) {
    const schedule = await this.getScheduleById(scheduleId);
    return this.calculateExpectedHoursForSchedule(schedule, periodStart, periodEnd);
  }
}
