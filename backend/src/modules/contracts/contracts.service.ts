import prisma from '../../config/prisma';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { rangesOverlap, intersectDateRanges, countCalendarDays } from '../../utils/dateHelpers';
import { auditLog } from '../audit/audit.service';
import { CreateContractInput, UpdateContractInput } from './contracts.schema';

export async function getContractsByEmployee(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new NotFoundError('Employee');

  return prisma.contract.findMany({
    where: { employeeId },
    include: { salaryStructure: true, workingSchedule: true },
    orderBy: { startDate: 'asc' },
  });
}

export async function getContract(id: string) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { salaryStructure: true, workingSchedule: true, employee: true },
  });
  if (!contract) throw new NotFoundError('Contract');
  return contract;
}

export async function createContract(input: CreateContractInput, actorId: string) {
  const start = new Date(input.startDate);
  const end = input.endDate ? new Date(input.endDate) : null;

  if (end && end < start) {
    throw new ValidationError('End date cannot be before start date');
  }

  // Check for overlapping active contracts
  const existing = await prisma.contract.findMany({
    where: {
      employeeId: input.employeeId,
      status: { in: ['DRAFT', 'ACTIVE'] },
    },
  });

  for (const c of existing) {
    if (rangesOverlap(start, end, c.startDate, c.endDate)) {
      throw new ConflictError(
        `Contract overlaps with existing contract (${c.startDate.toISOString().split('T')[0]} → ${c.endDate ? c.endDate.toISOString().split('T')[0] : 'open'})`
      );
    }
  }

  const contract = await prisma.contract.create({
    data: {
      employeeId: input.employeeId,
      startDate: start,
      endDate: end,
      wage: input.wage,
      salaryStructureId: input.salaryStructureId,
      workingScheduleId: input.workingScheduleId,
      status: input.status ?? 'ACTIVE',
    },
  });

  await auditLog({
    userId: actorId,
    action: 'CONTRACT_CREATED',
    entityType: 'Contract',
    entityId: contract.id,
    newData: contract,
  });

  return contract;
}

export async function updateContract(id: string, input: UpdateContractInput, actorId: string) {
  const existing = await prisma.contract.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Contract');

  const start = input.startDate ? new Date(input.startDate) : existing.startDate;
  const end = input.endDate !== undefined
    ? (input.endDate ? new Date(input.endDate) : null)
    : existing.endDate;

  if (end && end < start) {
    throw new ValidationError('End date cannot be before start date');
  }

  const updated = await prisma.contract.update({
    where: { id },
    data: {
      ...input,
      ...(input.startDate && { startDate: start }),
      ...(input.endDate !== undefined && { endDate: end }),
      ...(input.wage && { wage: input.wage }),
    },
  });

  await auditLog({
    userId: actorId,
    action: 'CONTRACT_UPDATED',
    entityType: 'Contract',
    entityId: id,
    oldData: existing,
    newData: updated,
  });

  return updated;
}

/**
 * Determines which contracts apply to a payroll period and how many days each covers.
 * This is the contract intelligence used by the payroll engine.
 */
export async function getApplicableContracts(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
) {
  const contracts = await prisma.contract.findMany({
    where: {
      employeeId,
      status: { in: ['ACTIVE', 'EXPIRED'] }, // Expired may still cover past periods
    },
    include: { salaryStructure: { include: { rules: { orderBy: { sequence: 'asc' } } } }, workingSchedule: true },
    orderBy: { startDate: 'asc' },
  });

  const applicable: Array<{
    contract: typeof contracts[0];
    applicableStart: Date;
    applicableEnd: Date;
    applicableDays: number;
    totalPeriodDays: number;
    fraction: number;
  }> = [];

  const totalPeriodDays = countCalendarDays(periodStart, periodEnd);

  for (const contract of contracts) {
    const intersection = intersectDateRanges(
      periodStart,
      periodEnd,
      contract.startDate,
      contract.endDate
    );

    if (intersection) {
      const applicableDays = countCalendarDays(intersection.start, intersection.end);
      applicable.push({
        contract,
        applicableStart: intersection.start,
        applicableEnd: intersection.end,
        applicableDays,
        totalPeriodDays,
        fraction: applicableDays / totalPeriodDays,
      });
    }
  }

  return {
    contracts: applicable,
    isValid: applicable.length > 0,
    totalPeriodDays,
  };
}
