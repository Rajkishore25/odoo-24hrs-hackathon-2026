import { z } from "zod";

export const dayOfWeekEnum = z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]);

export const createScheduleSchema = z.object({
  name: z.string().min(1, "Schedule name is required"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "startTime must be HH:MM format (e.g. 09:00)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "endTime must be HH:MM format (e.g. 18:00)"),
  breakMinutes: z.number().int().min(0).default(0),
  workingDays: z.array(dayOfWeekEnum).min(1, "At least one working day must be selected"),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export const expectedHoursQuerySchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "periodStart must be YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "periodEnd must be YYYY-MM-DD"),
  employeeId: z.string().uuid().optional(),
});
