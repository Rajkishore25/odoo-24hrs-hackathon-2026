import prisma from '../../config/prisma';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

const BREAK_MINUTES = 60; // default break if schedule not found

function computeWorkedHours(checkIn: Date, checkOut: Date, breakMinutes: number): number {
  const rawMs = checkOut.getTime() - checkIn.getTime();
  const rawHours = rawMs / (1000 * 60 * 60);
  const netHours = rawHours - breakMinutes / 60;
  return Math.max(0, Math.round(netHours * 100) / 100);
}

export async function checkIn(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new NotFoundError('Employee');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (existing?.checkIn) {
    throw new ConflictError('Already checked in today');
  }

  const now = new Date();

  if (existing) {
    return prisma.attendance.update({
      where: { id: existing.id },
      data: { checkIn: now, status: 'PRESENT' },
    });
  }

  return prisma.attendance.create({
    data: {
      employeeId,
      date: today,
      checkIn: now,
      status: 'PRESENT',
    },
  });
}

export async function checkOut(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId, date: today } },
  });

  if (!attendance) throw new ValidationError('No check-in found for today');
  if (!attendance.checkIn) throw new ValidationError('Cannot check out without checking in');
  if (attendance.checkOut) throw new ConflictError('Already checked out today');

  const now = new Date();
  const workedHours = computeWorkedHours(attendance.checkIn, now, BREAK_MINUTES);

  return prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOut: now,
      workedHours,
    },
  });
}

export async function listAttendance(query: Record<string, string>) {
  const { page, limit, skip } = parsePagination(query);
  const where: Record<string, unknown> = {};

  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;
  if (query.exceptionOnly === 'true') where.hasException = true;
  if (query.from || query.to) {
    where.date = {
      ...(query.from && { gte: new Date(query.from) }),
      ...(query.to && { lte: new Date(query.to) }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        employee: { select: { id: true, name: true, employeeCode: true } },
        exceptions: true,
      },
    }),
    prisma.attendance.count({ where }),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}

export async function createAttendance(data: {
  employeeId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status?: string;
}) {
  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: data.employeeId, date } },
  });
  if (existing) throw new ConflictError('Attendance record already exists for this date');

  const checkIn = data.checkIn ? new Date(data.checkIn) : null;
  const checkOut = data.checkOut ? new Date(data.checkOut) : null;
  const workedHours = checkIn && checkOut ? computeWorkedHours(checkIn, checkOut, BREAK_MINUTES) : 0;

  const hasException = !checkIn || !checkOut;

  const attendance = await prisma.attendance.create({
    data: {
      employeeId: data.employeeId,
      date,
      checkIn,
      checkOut,
      workedHours,
      status: (data.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_DEPARTURE' | 'MISSING_PUNCH') ?? (hasException ? 'MISSING_PUNCH' : 'PRESENT'),
      hasException,
    },
  });

  if (hasException) {
    await prisma.attendanceException.create({
      data: {
        employeeId: data.employeeId,
        attendanceId: attendance.id,
        type: 'MISSING_PUNCH',
        status: 'OPEN',
      },
    });
    await prisma.attendance.update({
      where: { id: attendance.id },
      data: { hasException: true },
    });
  }

  return attendance;
}

export async function updateAttendance(id: string, data: Partial<{
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}>) {
  const existing = await prisma.attendance.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Attendance');

  const checkIn = data.checkIn !== undefined ? (data.checkIn ? new Date(data.checkIn) : null) : existing.checkIn;
  const checkOut = data.checkOut !== undefined ? (data.checkOut ? new Date(data.checkOut) : null) : existing.checkOut;
  const workedHours = checkIn && checkOut ? computeWorkedHours(checkIn, checkOut, BREAK_MINUTES) : 0;

  return prisma.attendance.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      workedHours,
      ...(data.status && { status: data.status as 'PRESENT' | 'ABSENT' | 'LATE' | 'EARLY_DEPARTURE' | 'MISSING_PUNCH' }),
    },
  });
}

export async function listExceptions(query: Record<string, string>) {
  const { page, limit, skip } = parsePagination(query);
  const where: Record<string, unknown> = {};
  if (query.employeeId) where.employeeId = query.employeeId;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.attendanceException.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: { select: { id: true, name: true, employeeCode: true } },
        attendance: true,
      },
    }),
    prisma.attendanceException.count({ where }),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}

export async function updateException(id: string, data: { status: string; reason?: string }, reviewerId: string) {
  const exception = await prisma.attendanceException.findUnique({ where: { id } });
  if (!exception) throw new NotFoundError('Attendance Exception');

  return prisma.attendanceException.update({
    where: { id },
    data: {
      status: data.status as 'OPEN' | 'REVIEWED' | 'CORRECTED' | 'DISMISSED',
      reason: data.reason,
      reviewedById: reviewerId,
      reviewedAt: new Date(),
    },
  });
}
