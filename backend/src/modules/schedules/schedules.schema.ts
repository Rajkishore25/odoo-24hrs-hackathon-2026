import { z } from 'zod';

export const createScheduleSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
  breakMinutes: z.number().int().min(0).default(0),
  workingDays: z.array(z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])).min(1),
});

export const updateScheduleSchema = createScheduleSchema.partial();

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
