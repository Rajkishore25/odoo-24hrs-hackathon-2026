import { z } from "zod";

export const timeOffUnitEnum = z.enum(["DAYS", "HOURS"]);
export const timeOffStatusEnum = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]);

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isPaid: z.boolean().default(true),
  unit: timeOffUnitEnum.default("DAYS"),
});

export const createAllocationSchema = z.object({
  employeeId: z.string().uuid("employeeId must be a valid UUID"),
  timeOffTypeId: z.string().uuid("timeOffTypeId must be a valid UUID"),
  allocatedDays: z.number().positive("allocatedDays must be positive"),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "validFrom must be YYYY-MM-DD"),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "validTo must be YYYY-MM-DD"),
});

export const createTimeOffRequestSchema = z.object({
  employeeId: z.string().uuid("employeeId must be a valid UUID"),
  timeOffTypeId: z.string().uuid("timeOffTypeId must be a valid UUID"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
  reason: z.string().optional(),
});

export const rejectTimeOffSchema = z.object({
  reason: z.string().optional(),
});

export const timeOffRequestQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  status: timeOffStatusEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
