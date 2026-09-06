import { z } from 'zod';

export const createContractSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  wage: z.number().positive('Wage must be positive'),
  salaryStructureId: z.string().uuid(),
  workingScheduleId: z.string().uuid(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
});

export const updateContractSchema = createContractSchema.partial();

export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
