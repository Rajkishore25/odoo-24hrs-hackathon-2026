import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['HR_MANAGER', 'EMPLOYEE']),
  // Employee profile fields (required when creating an employee or HR linked to an employee record)
  employeeCode: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bankAccountNumber: z.string().optional(),
  bankName: z.string().optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
