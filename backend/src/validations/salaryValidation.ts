import { z } from "zod";

export const createSalaryStructureSchema = z.object({
  name: z.string().min(2, "Structure name must be at least 2 characters"),
  description: z.string().optional(),
});

export const updateSalaryStructureSchema = createSalaryStructureSchema.partial();

export const createSalaryRuleSchema = z.object({
  salaryStructureId: z.string().uuid("A valid salary structure ID is required"),
  name: z.string().min(2, "Rule name is required"),
  code: z.string().min(2, "Rule code is required").regex(/^[A-Z0-9_]+$/, "Code must be alphanumeric uppercase"),
  category: z.enum(["EARNING", "DEDUCTION", "NET"]),
  sequence: z.number().int().min(1, "Sequence must be a positive integer"),
  calculationType: z.enum(["FIXED", "PERCENTAGE", "REFERENCE"]),
  value: z.number().optional().nullable(),
  dependsOnCode: z.string().optional().nullable(),
  formulaDescription: z.string().optional().nullable(),
});

export const updateSalaryRuleSchema = createSalaryRuleSchema.partial();

export type CreateSalaryStructureInput = z.infer<typeof createSalaryStructureSchema>;
export type CreateSalaryRuleInput = z.infer<typeof createSalaryRuleSchema>;
