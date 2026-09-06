import prisma from '../../config/prisma';
import { NotFoundError, ValidationError, ForbiddenError } from '../../utils/errors';
import { countCalendarDays } from '../../utils/dateHelpers';
import { auditLog } from '../audit/audit.service';
import { CreateRequestInput } from './timeoff.schema';

// ── Leave Types ──────────────────────────────────────────────────────────────

export async function listTypes() {
  return prisma.timeOffType.findMany({ where: { isActive: true } });
}

export async function createType(data: { name: string; isPaid: boolean; unit: 'DAYS' | 'HOURS' }) {
  return prisma.timeOffType.create({ data });
}

// ── Allocations ──────────────────────────────────────────────────────────────

export async function listAllocations(employeeId?: string) {
  return prisma.timeOffAllocation.findMany({
    where: employeeId ? { employeeId } : undefined,
    include: { employee: { select: { id: true, name: true, employeeCode: true } }, timeOffType: true },
    orderBy: { validFrom: 'desc' },
  });
}

export async function createAllocation(data: {
  employeeId: string;
  timeOffTypeId: string;
  allocatedDays: number;
  validFrom: string;
  validTo: string;
}) {
  const validFrom = new Date(data.validFrom);
  const validTo = new Date(data.validTo);
  if (validTo < validFrom) throw new ValidationError('validTo must be after validFrom');

  return prisma.timeOffAllocation.create({
    data: {
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      allocatedDays: data.allocatedDays,
      validFrom,
      validTo,
    },
  });
}

// ── Requests ─────────────────────────────────────────────────────────────────

export async function listRequests(query: {
  employeeId?: string;
  status?: string;
  requesterRole?: string;   // used to filter out HR leave from non-admins
  page?: string;
  limit?: string;
}) {
  const where: Record<string, unknown> = {};
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;

  // Business rule: HR_MANAGER leave requests are only visible to SUPER_ADMIN.
  // All other roles (LINE_MANAGER, PAYROLL_OFFICER) must not see HR leave.
  if (query.requesterRole && query.requesterRole !== 'SUPER_ADMIN') {
    // Exclude any request whose employee is linked to a user with HR_MANAGER role
    where.employee = {
      user: {
        role: { not: 'HR_MANAGER' },
      },
    };
  }

  return prisma.timeOffRequest.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true, name: true, employeeCode: true,
          user: { select: { role: true } },
        },
      },
      timeOffType: true,
      approver: { select: { id: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRequest(input: CreateRequestInput) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  if (end < start) throw new ValidationError('End date cannot be before start date');

  const requestedDays = countCalendarDays(start, end);

  // Check leave balance
  const balance = await getBalance(input.employeeId, input.timeOffTypeId);
  if (balance.remaining < requestedDays) {
    throw new ValidationError(
      `Insufficient leave balance. Available: ${balance.remaining} day(s), Requested: ${requestedDays} day(s)`
    );
  }

  return prisma.timeOffRequest.create({
    data: {
      employeeId: input.employeeId,
      timeOffTypeId: input.timeOffTypeId,
      startDate: start,
      endDate: end,
      requestedDays,
      reason: input.reason,
      status: 'SUBMITTED',
    },
  });
}

export async function approveRequest(id: string, approverId: string, approverRole: string) {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      timeOffType: true,
      employee: { include: { user: { select: { role: true } } } },
    },
  });
  if (!request) throw new NotFoundError('Leave Request');
  if (request.status !== 'SUBMITTED') {
    throw new ValidationError(`Cannot approve a request with status: ${request.status}`);
  }

  // Only SUPER_ADMIN can approve leave for HR_MANAGER employees
  if (request.employee.user?.role === 'HR_MANAGER' && approverRole !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only the Super Admin can approve leave requests made by HR Managers');
  }

  const updated = await prisma.timeOffRequest.update({
    where: { id },
    data: { status: 'APPROVED', approverId, approvedAt: new Date() },
  });

  await auditLog({
    userId: approverId,
    action: 'LEAVE_APPROVED',
    entityType: 'TimeOffRequest',
    entityId: id,
    oldData: { status: 'SUBMITTED' },
    newData: { status: 'APPROVED' },
  });

  return updated;
}

export async function rejectRequest(id: string, approverId: string, approverRole: string, reason?: string) {
  const request = await prisma.timeOffRequest.findUnique({
    where: { id },
    include: {
      employee: { include: { user: { select: { role: true } } } },
    },
  });
  if (!request) throw new NotFoundError('Leave Request');
  if (request.status !== 'SUBMITTED') {
    throw new ValidationError(`Cannot reject a request with status: ${request.status}`);
  }

  // Only SUPER_ADMIN can reject leave for HR_MANAGER employees
  if (request.employee.user?.role === 'HR_MANAGER' && approverRole !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only the Super Admin can reject leave requests made by HR Managers');
  }

  const updated = await prisma.timeOffRequest.update({
    where: { id },
    data: { status: 'REJECTED', approverId, rejectionReason: reason },
  });

  await auditLog({
    userId: approverId,
    action: 'LEAVE_REJECTED',
    entityType: 'TimeOffRequest',
    entityId: id,
    oldData: { status: 'SUBMITTED' },
    newData: { status: 'REJECTED', rejectionReason: reason },
  });

  return updated;
}

// ── Balance ───────────────────────────────────────────────────────────────────

export async function getBalance(employeeId: string, timeOffTypeId?: string) {
  const now = new Date();

  const allocationWhere: Record<string, unknown> = {
    employeeId,
    validFrom: { lte: now },
    validTo: { gte: now },
  };
  if (timeOffTypeId) allocationWhere.timeOffTypeId = timeOffTypeId;

  const allocations = await prisma.timeOffAllocation.findMany({ where: allocationWhere });

  const usedWhere: Record<string, unknown> = {
    employeeId,
    status: 'APPROVED',
  };
  if (timeOffTypeId) usedWhere.timeOffTypeId = timeOffTypeId;

  const usedRequests = await prisma.timeOffRequest.findMany({ where: usedWhere });

  const allocated = allocations.reduce((sum, a) => sum + Number(a.allocatedDays), 0);
  const used = usedRequests.reduce((sum, r) => sum + Number(r.requestedDays), 0);
  const remaining = Math.max(0, allocated - used);

  return { allocated, used, remaining };
}

export async function getBalanceByEmployee(employeeId: string) {
  const types = await prisma.timeOffType.findMany({ where: { isActive: true } });
  const balances = await Promise.all(
    types.map(async (type) => {
      const balance = await getBalance(employeeId, type.id);
      return { type, ...balance };
    })
  );
  return balances;
}

export async function getApprovedLeaveInPeriod(employeeId: string, periodStart: Date, periodEnd: Date) {
  const requests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId,
      status: 'APPROVED',
      startDate: { lte: periodEnd },
      endDate: { gte: periodStart },
    },
    include: { timeOffType: true },
  });

  let totalDays = 0;
  for (const req of requests) {
    const overlapStart = req.startDate > periodStart ? req.startDate : periodStart;
    const overlapEnd = req.endDate < periodEnd ? req.endDate : periodEnd;
    if (overlapEnd >= overlapStart) {
      totalDays += countCalendarDays(overlapStart, overlapEnd);
    }
  }

  return { requests, totalDays };
}
