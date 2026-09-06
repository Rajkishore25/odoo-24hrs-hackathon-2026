import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma';
import { config } from '../../config/env';
import { UnauthorizedError, ForbiddenError, ConflictError, ValidationError } from '../../utils/errors';
import { LoginInput, CreateAccountInput, ChangePasswordInput } from './auth.schema';

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) throw new UnauthorizedError('Invalid email or password');

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Invalid email or password');

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);

  return { accessToken, user: { id: user.id, email: user.email, role: user.role } };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, role: true, isActive: true,
      employee: {
        select: {
          id: true, name: true, employeeCode: true,
          department: true, designation: true,
        },
      },
    },
  });
  if (!user) throw new UnauthorizedError('User not found');
  return user;
}

/**
 * Create a new user account.
 * - SUPER_ADMIN can create HR_MANAGER or EMPLOYEE accounts.
 * - HR_MANAGER can only create EMPLOYEE accounts.
 * - No one else can create accounts.
 * - The creator sets the email and initial password.
 */
export async function createAccount(input: CreateAccountInput, creatorRole: string) {
  // Role permission check
  if (creatorRole === 'HR_MANAGER' && input.role !== 'EMPLOYEE') {
    throw new ForbiddenError('HR Managers can only create Employee accounts');
  }
  if (!['SUPER_ADMIN', 'HR_MANAGER'].includes(creatorRole)) {
    throw new ForbiddenError('You do not have permission to create accounts');
  }

  // Email uniqueness
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError(`An account with email "${input.email}" already exists`);

  // Employee code uniqueness
  const existingEmp = await prisma.employee.findUnique({ where: { employeeCode: input.employeeCode } });
  if (existingEmp) throw new ConflictError(`Employee code "${input.employeeCode}" is already in use`);

  const passwordHash = await bcrypt.hash(input.password, 10);

  // Create user + employee in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: input.role,
      },
    });

    const employee = await tx.employee.create({
      data: {
        userId: user.id,
        employeeCode: input.employeeCode,
        name: input.name,
        email: input.email,
        phone: input.phone,
        department: input.department,
        designation: input.designation,
        joiningDate: new Date(input.joiningDate),
        bankAccountNumber: input.bankAccountNumber,
        bankName: input.bankName,
      },
    });

    return { user: { id: user.id, email: user.email, role: user.role }, employee };
  });

  return result;
}

/**
 * Change password — user must supply their current password.
 * Only the account owner can change their own password.
 */
export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new UnauthorizedError('User not found');

  const valid = await bcrypt.compare(input.oldPassword, user.passwordHash);
  if (!valid) throw new ValidationError('Current password is incorrect');

  if (input.oldPassword === input.newPassword) {
    throw new ValidationError('New password must be different from the current password');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  return { message: 'Password changed successfully' };
}
