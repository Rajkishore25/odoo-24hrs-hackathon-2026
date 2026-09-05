import { z } from "zod";

export const attendanceStatusEnum = z.enum([
  "PRESENT",
  "ABSENT",
  "LATE",
  "EARLY_DEPARTURE",
  "MISSING_PUNCH",
]);

export const exceptionTypeEnum = z.enum([
  "MISSING_PUNCH",
  "UNUSUAL_HOURS",
  "INVALID_PUNCH",
  "OTHER",
]);

export const exceptionStatusEnum = z.enum(["OPEN", "REVIEWED", "CORRECTED", "DISMISSED"]);

export const punchSchema = z.object({
  employeeId: z.string().uuid("employeeId must be a valid UUID"),
});

export const manualAttendanceSchema = z.object({
  employeeId: z.string().uuid("employeeId must be a valid UUID"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  checkIn: z.string().datetime({ offset: true }).optional().nullable(),
  checkOut: z.string().datetime({ offset: true }).optional().nullable(),
  workedHours: z.number().min(0).max(24).optional(),
  status: attendanceStatusEnum.default("PRESENT"),
});

export const updateAttendanceSchema = z.object({
  checkIn: z.string().datetime({ offset: true }).optional().nullable(),
  checkOut: z.string().datetime({ offset: true }).optional().nullable(),
  workedHours: z.number().min(0).max(24).optional(),
  status: attendanceStatusEnum.optional(),
  hasException: z.boolean().optional(),
});

export const attendanceQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: attendanceStatusEnum.optional(),
  exceptionOnly: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reviewExceptionSchema = z.object({
  status: exceptionStatusEnum,
  reason: z.string().min(1, "Reason is required"),
});
