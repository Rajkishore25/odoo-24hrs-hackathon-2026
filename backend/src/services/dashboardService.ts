import { db } from "../config/database.js";
import { ValidationEngine } from "./validationEngine.js";

export class DashboardService {
  /**
   * Aggregates real-time executive dashboard KPIs and actionable alerts.
   */
  static async getMetrics() {
    const [
      activeEmployeesCount,
      pendingLeaveCount,
      openExceptionsCount,
      latestPayrun,
      recentPayruns,
    ] = await Promise.all([
      db.employee.count({ where: { status: "ACTIVE" } }),
      db.timeOffRequest.count({ where: { status: "SUBMITTED" } }),
      db.attendanceException.count({ where: { status: "OPEN" } }),
      db.payrun.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { payslips: true } },
        },
      }),
      db.payrun.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          periodStart: true,
          periodEnd: true,
          status: true,
          totalGross: true,
          totalNet: true,
        },
      }),
    ]);

    let criticalIssuesCount = 0;
    let warningsCount = 0;

    if (latestPayrun && latestPayrun.status !== "FINALIZED" && latestPayrun.status !== "PAID") {
      const activeEmployees = await db.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });
      const employeeIds = activeEmployees.map((e) => e.id);

      const validation = await ValidationEngine.validate(
        latestPayrun.periodStart,
        latestPayrun.periodEnd,
        employeeIds
      );
      criticalIssuesCount = validation.summary.criticalCount;
      warningsCount = validation.summary.warningCount;
    }

    return {
      employees: {
        activeCount: activeEmployeesCount,
      },
      currentPayrun: latestPayrun
        ? {
            id: latestPayrun.id,
            name: latestPayrun.name,
            periodStart: latestPayrun.periodStart,
            periodEnd: latestPayrun.periodEnd,
            status: latestPayrun.status,
            totalGross: latestPayrun.totalGross,
            totalNet: latestPayrun.totalNet,
            employeeCount: latestPayrun._count.payslips,
          }
        : null,
      alerts: {
        pendingLeaveCount,
        openAttendanceExceptionsCount: openExceptionsCount,
        criticalPayrollIssuesCount: criticalIssuesCount,
        payrollWarningsCount: warningsCount,
      },
      recentPayruns,
    };
  }
}

export default DashboardService;
