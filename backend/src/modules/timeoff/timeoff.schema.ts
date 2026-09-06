import { z } from 'zod';

export const createTimeOffTypeSchema = z.object({
  name: z.string().min(1),
  isPaid: z.boolean(),
  unit: z.enum(['DAYS', 'HOURS']).default('DAYS'),
});

export const createAllocationSchema = z.object({
  employeeId: z.string().uuid(),
  timeOffTypeId: z.string().uuid(),
  allocatedDays: z.number().positive(),
  validFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createRequestSchema = z.object({
  employeeId: z.string().uuid(),
  timeOffTypeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
});

export const rejectRequestSchema = z.object({
  reason: z.string().optional(),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
