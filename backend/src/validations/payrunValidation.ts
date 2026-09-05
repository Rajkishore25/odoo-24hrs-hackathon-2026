import { z } from "zod";

export const createPayrunSchema = z.object({
  name: z.string().min(2, "Payrun name is required").optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  employeeIds: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => new Date(data.periodStart) <= new Date(data.periodEnd),
  { message: "periodStart must be before or equal to periodEnd", path: ["periodStart"] }
);

export const payrunQuerySchema = z.object({
  status: z.enum(["DRAFT", "IN_PROGRESS", "VALIDATED", "FINALIZED", "PAID"]).optional(),
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
});

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>;
