import { z } from 'zod';

export const checkInSchema = z.object({
  employeeId: z.string().uuid(),
});

export const checkOutSchema = z.object({
  employeeId: z.string().uuid(),
});

export const createAttendanceSchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn: z.string().datetime().optional().nullable(),
  checkOut: z.string().datetime().optional().nullable(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EARLY_DEPARTURE', 'MISSING_PUNCH']).optional(),
});

export const updateAttendanceSchema = createAttendanceSchema.partial();

export const updateExceptionSchema = z.object({
  status: z.enum(['OPEN', 'REVIEWED', 'CORRECTED', 'DISMISSED']),
  reason: z.string().optional(),
});

export const attendanceQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EARLY_DEPARTURE', 'MISSING_PUNCH']).optional(),
  exceptionOnly: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
