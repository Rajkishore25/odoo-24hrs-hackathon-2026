/**
 * PeoplePay360 — Payroll Validation Engine
 *
 * Produces CRITICAL and WARNING issues for a computed payrun.
 * CRITICAL errors block finalization at the API level.
 */

import prisma from '../../config/prisma';
import { getApplicableContracts } from '../contracts/contracts.service';

export type ValidationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  message: string;
  suggestedAction: string;
}

export interface ValidationResult {
  status: 'CLEAR' | 'WARNINGS_ONLY' | 'BLOCKED';
  canFinalize: boolean;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  employeesChecked: number;
  issues: ValidationIssue[];
  summary: {
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    employeesChecked: number;
  };
}

const OVERTIME_THRESHOLD_HOURS = 50;
const SALARY_CHANGE_THRESHOLD_PERCENT = 20;

export async function validatePayrun(payrunId: string): Promise<ValidationResult> {
  const payrun = await prisma.payrun.findUnique({
    where: { id: payrunId },
    include: {
      payslips: {
        include: {
          employee: true,
          lines: true,
        },
      },
    },
  });

  if (!payrun) throw new Error('Payrun not found');

  const issues: ValidationIssue[] = [];
  const periodStart = payrun.periodStart;
  const periodEnd = payrun.periodEnd;

  for (const payslip of payrun.payslips) {
    const emp = payslip.employee;
    const empInfo = { employeeId: emp.id, employeeName: emp.name, employeeCode: emp.employeeCode };

    // ── CRITICAL: No valid contract ──────────────────────────────────────────
    const contractResult = await getApplicableContracts(emp.id, periodStart, periodEnd);
    if (!contractResult.isValid) {
      issues.push({
        code: 'NO_ACTIVE_CONTRACT',
        severity: 'CRITICAL',
        ...empInfo,
        message: `No applicable contract found for the payroll period (${formatDate(periodStart)} – ${formatDate(periodEnd)})`,
        suggestedAction: 'Create or activate a contract covering this payroll period',
      });
    }

    // ── CRITICAL: Missing bank/payment information ───────────────────────────
    if (!emp.bankAccountNumber || !emp.bankName) {
      issues.push({
        code: 'MISSING_BANK_INFO',
        severity: 'CRITICAL',
        ...empInfo,
        message: 'Employee is missing bank account or bank name information',
        suggestedAction: 'Update employee profile with payment details',
      });
    }

    // ── CRITICAL: Negative net salary ────────────────────────────────────────
    const net = Number(payslip.net);
    if (net < 0) {
      issues.push({
        code: 'NEGATIVE_NET_SALARY',
        severity: 'CRITICAL',
        ...empInfo,
        message: `Net salary is negative: ₹${net.toFixed(2)}. Deductions exceed gross earnings.`,
        suggestedAction: 'Review salary rules and deduction configuration',
      });
    }

    // ── CRITICAL: Duplicate payrun for same employee/period ──────────────────
    const duplicatePayslips = await prisma.payslip.count({
      where: {
        employeeId: emp.id,
        payrunId: { not: payrunId },
        payrun: {
          periodStart: payrun.periodStart,
          periodEnd: payrun.periodEnd,
          status: { in: ['FINALIZED', 'PAID'] },
        },
      },
    });
    if (duplicatePayslips > 0) {
      issues.push({
        code: 'DUPLICATE_PAYROLL',
        severity: 'CRITICAL',
        ...empInfo,
        message: `A finalized payrun already exists for this employee in period ${formatDate(periodStart)} – ${formatDate(periodEnd)}`,
        suggestedAction: 'Cancel the duplicate payrun or verify the payroll period',
      });
    }

    // ── CRITICAL: Missing salary structure ───────────────────────────────────
    if (payslip.lines.length === 0 && contractResult.isValid) {
      issues.push({
        code: 'NO_SALARY_RULES',
        severity: 'CRITICAL',
        ...empInfo,
        message: 'No salary lines were generated. Salary structure may have no active rules.',
        suggestedAction: 'Configure salary rules in the assigned salary structure',
      });
    }

    // ── WARNING: Unresolved attendance exceptions ─────────────────────────────
    const openExceptions = await prisma.attendanceException.count({
      where: {
        employeeId: emp.id,
        status: 'OPEN',
        attendance: {
          date: { gte: periodStart, lte: periodEnd },
        },
      },
    });
    if (openExceptions > 0) {
      issues.push({
        code: 'ATTENDANCE_EXCEPTION',
        severity: 'WARNING',
        ...empInfo,
        message: `${openExceptions} unresolved attendance exception(s) in this payroll period`,
        suggestedAction: 'Review and resolve attendance exceptions before finalizing',
      });
    }

    // ── WARNING: Missing attendance records ───────────────────────────────────
    const attendanceCount = await prisma.attendance.count({
      where: {
        employeeId: emp.id,
        date: { gte: periodStart, lte: periodEnd },
      },
    });
    if (attendanceCount === 0 && contractResult.isValid) {
      issues.push({
        code: 'NO_ATTENDANCE_RECORDS',
        severity: 'WARNING',
        ...empInfo,
        message: 'No attendance records found for this payroll period',
        suggestedAction: 'Verify attendance data for this employee',
      });
    }

    // ── WARNING: Excessive worked hours ──────────────────────────────────────
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: emp.id,
        date: { gte: periodStart, lte: periodEnd },
      },
    });
    const totalWorkedHours = attendances.reduce((sum, a) => sum + Number(a.workedHours), 0);

    // Determine expected hours from schedule
    if (contractResult.contracts.length > 0) {
      const schedule = contractResult.contracts[0].contract.workingSchedule;
      const workingDays = schedule.workingDays as string[];
      const [sh, sm] = schedule.startTime.split(':').map(Number);
      const [eh, em] = schedule.endTime.split(':').map(Number);
      const netHoursPerDay = ((eh * 60 + em) - (sh * 60 + sm) - schedule.breakMinutes) / 60;
      const { countWorkingDays } = await import('../../utils/dateHelpers');
      const expectedDays = countWorkingDays(periodStart, periodEnd, workingDays);
      const expectedHours = expectedDays * netHoursPerDay;
      const overtime = totalWorkedHours - expectedHours;

      if (overtime > OVERTIME_THRESHOLD_HOURS) {
        issues.push({
          code: 'EXCESSIVE_OVERTIME',
          severity: 'WARNING',
          ...empInfo,
          message: `Overtime of ${Math.round(overtime)} hours exceeds the threshold of ${OVERTIME_THRESHOLD_HOURS} hours`,
          suggestedAction: 'Verify attendance records for data accuracy',
        });
      }
    }

    // ── WARNING: Significant salary change vs previous payslip ───────────────
    const previousPayslip = await prisma.payslip.findFirst({
      where: {
        employeeId: emp.id,
        payrunId: { not: payrunId },
        status: { in: ['VALIDATED', 'PAID'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (previousPayslip) {
      const prevNet = Number(previousPayslip.net);
      const currentNet = net;
      if (prevNet > 0) {
        const changePercent = Math.abs((currentNet - prevNet) / prevNet) * 100;
        if (changePercent > SALARY_CHANGE_THRESHOLD_PERCENT) {
          issues.push({
            code: 'UNUSUAL_SALARY_CHANGE',
            severity: 'WARNING',
            ...empInfo,
            message: `Net salary changed by ${Math.round(changePercent)}% compared to the previous payslip (₹${prevNet.toFixed(2)} → ₹${currentNet.toFixed(2)})`,
            suggestedAction: 'Verify contract changes or salary rule updates',
          });
        }
      }
    }
  }

  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = issues.filter((i) => i.severity === 'WARNING').length;
  const infoCount = issues.filter((i) => i.severity === 'INFO').length;

  let status: ValidationResult['status'] = 'CLEAR';
  if (criticalCount > 0) status = 'BLOCKED';
  else if (warningCount > 0) status = 'WARNINGS_ONLY';

  return {
    status,
    canFinalize: criticalCount === 0,
    criticalCount,
    warningCount,
    infoCount,
    employeesChecked: payrun.payslips.length,
    issues,
    summary: {
      criticalCount,
      warningCount,
      infoCount,
      employeesChecked: payrun.payslips.length,
    },
  };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
