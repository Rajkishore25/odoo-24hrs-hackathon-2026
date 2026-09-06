import prisma from '../../config/prisma';
import { validatePayrun } from '../payroll/payroll.validation';

export async function getDashboard() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // ── Employee stats ────────────────────────────────────────────────────────
  const [totalEmployees, activeEmployees] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } }),
  ]);

  // ── Leave requests ────────────────────────────────────────────────────────
  const pendingLeaveRequests = await prisma.timeOffRequest.count({
    where: { status: 'SUBMITTED' },
  });

  // ── Attendance exceptions ─────────────────────────────────────────────────
  const openAttendanceExceptions = await prisma.attendanceException.count({
    where: { status: 'OPEN' },
  });

  // ── Current payrun ────────────────────────────────────────────────────────
  const currentPayrun = await prisma.payrun.findFirst({
    where: { status: { in: ['DRAFT', 'IN_PROGRESS', 'VALIDATED'] } },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { payslips: true } } },
  });

  // ── Recent payruns ────────────────────────────────────────────────────────
  const recentPayruns = await prisma.payrun.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      status: true,
      periodStart: true,
      periodEnd: true,
      totalNet: true,
      _count: { select: { payslips: true } },
    },
  });

  // ── Validation status for current payrun ─────────────────────────────────
  let validationStatus = null;
  if (currentPayrun && currentPayrun.status !== 'DRAFT') {
    try {
      const validation = await validatePayrun(currentPayrun.id);
      validationStatus = {
        payrunId: currentPayrun.id,
        status: validation.status,
        criticalCount: validation.criticalCount,
        warningCount: validation.warningCount,
        canFinalize: validation.canFinalize,
      };
    } catch {
      // Validation errors should not crash the dashboard
      validationStatus = null;
    }
  }

  // ── Today's attendance ────────────────────────────────────────────────────
  const todayAttendanceCount = await prisma.attendance.count({
    where: { date: { gte: todayStart, lte: todayEnd } },
  });

  // ── Payroll totals (last finalized) ──────────────────────────────────────
  const lastFinalized = await prisma.payrun.findFirst({
    where: { status: { in: ['FINALIZED', 'PAID'] } },
    orderBy: { finalizedAt: 'desc' },
    select: {
      id: true,
      name: true,
      totalGross: true,
      totalDeductions: true,
      totalNet: true,
      finalizedAt: true,
      _count: { select: { payslips: true } },
    },
  });

  return {
    employees: {
      total: totalEmployees,
      active: activeEmployees,
      inactive: totalEmployees - activeEmployees,
    },
    leave: {
      pendingRequests: pendingLeaveRequests,
    },
    attendance: {
      openExceptions: openAttendanceExceptions,
      todayCount: todayAttendanceCount,
    },
    payroll: {
      currentPayrun: currentPayrun
        ? {
            id: currentPayrun.id,
            name: currentPayrun.name,
            status: currentPayrun.status,
            periodStart: currentPayrun.periodStart,
            periodEnd: currentPayrun.periodEnd,
            employeeCount: currentPayrun._count.payslips,
          }
        : null,
      validationStatus,
      lastFinalized,
      recentPayruns,
    },
  };
}
