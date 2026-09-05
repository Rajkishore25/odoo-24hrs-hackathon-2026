import { z } from "zod";

export const contractStatusEnum = z.enum(["DRAFT", "ACTIVE", "EXPIRED", "CANCELLED"]);

export const createContractSchema = z.object({
  employeeId: z.string().uuid("employeeId must be a valid UUID"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD").optional().nullable(),
  wage: z.number().positive("wage must be greater than 0"),
  salaryStructureId: z.string().uuid("salaryStructureId must be a valid UUID"),
  workingScheduleId: z.string().uuid("workingScheduleId must be a valid UUID"),
  status: contractStatusEnum.default("DRAFT"),
});

export const updateContractSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  wage: z.number().positive().optional(),
  salaryStructureId: z.string().uuid().optional(),
  workingScheduleId: z.string().uuid().optional(),
  status: contractStatusEnum.optional(),
});

export const applicableContractsQuerySchema = z.object({
  employeeId: z.string().uuid("employeeId must be a valid UUID"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "periodStart must be YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "periodEnd must be YYYY-MM-DD"),
});
