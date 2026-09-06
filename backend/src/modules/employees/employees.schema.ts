import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
  userId: z.string().uuid().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
});

export const employeeQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
