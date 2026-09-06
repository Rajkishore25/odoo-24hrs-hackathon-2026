import prisma from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import { CreateEmployeeInput, UpdateEmployeeInput } from './employees.schema';
import { auditLog } from '../audit/audit.service';

export async function listEmployees(query: {
  search?: string;
  department?: string;
  status?: string;
  page?: string;
  limit?: string;
}) {
  const { page, limit, skip } = parsePagination(query);

  const where: Record<string, unknown> = {};

  if (query.status) {
    where.status = query.status;
  }
  if (query.department) {
    where.department = { contains: query.department, mode: 'insensitive' };
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { employeeCode: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        employeeCode: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        joiningDate: true,
        status: true,
      },
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}

export async function getEmployee(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      contracts: {
        include: { salaryStructure: true, workingSchedule: true },
        orderBy: { startDate: 'asc' },
      },
      _count: {
        select: { attendances: true, timeOffRequests: true, payslips: true },
      },
    },
  });

  if (!employee) throw new NotFoundError('Employee');
  return employee;
}

export async function createEmployee(input: CreateEmployeeInput, actorId: string) {
  const existing = await prisma.employee.findUnique({
    where: { employeeCode: input.employeeCode },
  });
  if (existing) throw new ConflictError(`Employee code "${input.employeeCode}" already exists`);

  const employee = await prisma.employee.create({
    data: {
      ...input,
      joiningDate: new Date(input.joiningDate),
    },
  });

  await auditLog({
    userId: actorId,
    action: 'EMPLOYEE_CREATED',
    entityType: 'Employee',
    entityId: employee.id,
    newData: employee,
  });

  return employee;
}

export async function updateEmployee(id: string, input: UpdateEmployeeInput, actorId: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Employee');

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      ...input,
      ...(input.joiningDate && { joiningDate: new Date(input.joiningDate) }),
    },
  });

  await auditLog({
    userId: actorId,
    action: 'EMPLOYEE_UPDATED',
    entityType: 'Employee',
    entityId: id,
    oldData: existing,
    newData: updated,
  });

  return updated;
}

export async function archiveEmployee(id: string, actorId: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Employee');

  const updated = await prisma.employee.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });

  await auditLog({
    userId: actorId,
    action: 'EMPLOYEE_ARCHIVED',
    entityType: 'Employee',
    entityId: id,
    oldData: { status: existing.status },
    newData: { status: 'ARCHIVED' },
  });

  return updated;
}
