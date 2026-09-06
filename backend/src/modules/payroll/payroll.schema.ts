import { z } from 'zod';

export const createPayrunSchema = z.object({
  name: z.string().min(1).optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employeeIds: z.array(z.string().uuid()).min(1),
});

export type CreatePayrunInput = z.infer<typeof createPayrunSchema>;
