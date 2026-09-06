import { z } from 'zod';

export const createStructureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const updateStructureSchema = createStructureSchema.partial();

export const createRuleSchema = z.object({
  structureId: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1).toUpperCase(),
  category: z.enum(['EARNING', 'DEDUCTION', 'NET']),
  sequence: z.number().int().positive(),
  calculationType: z.enum(['FIXED', 'PERCENTAGE', 'REFERENCE']),
  value: z.number().optional().nullable(),
  dependsOnCode: z.string().optional().nullable(),
  formulaDescription: z.string().optional(),
});

export const updateRuleSchema = createRuleSchema.partial();

export type CreateRuleInput = z.infer<typeof createRuleSchema>;
