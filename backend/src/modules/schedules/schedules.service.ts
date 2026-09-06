import prisma from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { countWorkingDays } from '../../utils/dateHelpers';
import { CreateScheduleInput } from './schedules.schema';

export async function listSchedules() {
  return prisma.workingSchedule.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getSchedule(id: string) {
  const schedule = await prisma.workingSchedule.findUnique({ where: { id } });
  if (!schedule) throw new NotFoundError('Working Schedule');
  return schedule;
}

export async function createSchedule(input: CreateScheduleInput) {
  return prisma.workingSchedule.create({
    data: {
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      breakMinutes: input.breakMinutes,
      workingDays: input.workingDays,
    },
  });
}

export async function updateSchedule(id: string, input: Partial<CreateScheduleInput>) {
  const existing = await prisma.workingSchedule.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Working Schedule');

  return prisma.workingSchedule.update({
    where: { id },
    data: input,
  });
}

export async function getExpectedHours(
  scheduleId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<{ scheduledDays: number; expectedHours: number }> {
  const schedule = await prisma.workingSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new NotFoundError('Working Schedule');

  const workingDays = schedule.workingDays as string[];
  const [startH, startM] = schedule.startTime.split(':').map(Number);
  const [endH, endM] = schedule.endTime.split(':').map(Number);
  const grossMinutesPerDay = (endH * 60 + endM) - (startH * 60 + startM);
  const netMinutesPerDay = grossMinutesPerDay - schedule.breakMinutes;
  const netHoursPerDay = netMinutesPerDay / 60;

  const scheduledDays = countWorkingDays(periodStart, periodEnd, workingDays);
  const expectedHours = Math.round(scheduledDays * netHoursPerDay * 100) / 100;

  return { scheduledDays, expectedHours };
}
