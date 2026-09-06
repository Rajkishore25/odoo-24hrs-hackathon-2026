/**
 * PeoplePay360 — Payroll Engine
 *
 * Deterministic salary rule executor.
 * Same inputs + same rules = same output. Always.
 *
 * Salary Calculation Logic:
 * ─────────────────────────
 * 1.  BASIC salary = prorated contract wage
 * 2.  Expected working days = schedule-based working days in period
 * 3.  Daily rate = BASIC / Expected working days
 * 4.  Actual days worked from attendance records
 * 5.  Absent days = Expected days − Actual days worked
 * 6.  Paid leave taken in period (approved, isPaid=true leave types)
 * 7.  Paid leave allocated to employee (annual allocation)
 * 8.  Excess leave = max(0, paid leave taken − paid leave allocated)
 *     + unpaid leave taken (explicitly unpaid leave type)
 * 9.  Unpaid deduction = (Daily rate × excess leave days) + company unpaid rate
 * 10. Absent without leave = max(0, absent days − paid leave taken)
 *     These days are also deducted at daily rate
 */

import { SalaryRule, SalaryRuleCategory } from '@prisma/client';
import prisma from '../../config/prisma';
import { getApplicableContracts } from '../contracts/contracts.service';
import { getApprovedLeaveInPeriod, getPaidLeaveAllocationForPeriod } from '../timeoff/timeoff.service';
import { countWorkingDays } from '../../utils/dateHelpers';

export interface PayslipLineResult {
  ruleId: string | null;
  code: string;
  name: string;
  category: SalaryRuleCategory;
  sequence: number;
  inputValues: Record<string, number>;
  formulaDescription: string;
  amount: number;
}

export interface PayrollComputationResult {
  employeeId: string;
  lines: PayslipLineResult[];
  gross: number;
  totalDeductions: number;
  net: number;
  computedAt: Date;
  hasError: boolean;
  errorMessage?: string;
  // Detailed breakdown for explainability
  breakdown: {
    basicWage: number;
    expectedWorkingDays: number;
    dailyRate: number;
    actualDaysWorked: number;
    absentDays: number;
    paidLeaveTaken: number;
    paidLeaveAllocated: number;
    unpaidLeaveTaken: number;
    excessPaidLeave: number;          // paid leave taken beyond allocation
    absentWithoutLeave: number;       // absent and no leave approved
    totalUnpaidDays: number;          // excess paid leave + unpaid leave + absent-without-leave
    unpaidDeductionAmount: number;
  };
}

export async function computeEmployeePayroll(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayrollComputationResult> {
  const emptyBreakdown = {
    basicWage: 0, expectedWorkingDays: 0, dailyRate: 0,
    actualDaysWorked: 0, absentDays: 0,
    paidLeaveTaken: 0, paidLeaveAllocated: 0, unpaidLeaveTaken: 0,
    excessPaidLeave: 0, absentWithoutLeave: 0,
    totalUnpaidDays: 0, unpaidDeductionAmount: 0,
  };

  const result: PayrollComputationResult = {
    employeeId, lines: [], gross: 0, totalDeductions: 0, net: 0,
    computedAt: new Date(), hasError: false, breakdown: emptyBreakdown,
  };

  try {
    // ── 1. Resolve applicable contracts ──────────────────────────────────────
    const { contracts: applicableContracts, isValid } = await getApplicableContracts(
      employeeId, periodStart, periodEnd
    );

    if (!isValid || applicableContracts.length === 0) {
      return { ...result, hasError: true, errorMessage: 'No applicable contract found for this payroll period' };
    }

    const primaryContract = applicableContracts[0].contract;
    const salaryStructure = primaryContract.salaryStructure;
    const workingSchedule = primaryContract.workingSchedule;

    // ── 2. Prorated base wage ─────────────────────────────────────────────────
    let proratedWage = 0;
    const totalPeriodDays = applicableContracts[0].totalPeriodDays;
    for (const { contract, applicableDays } of applicableContracts) {
      proratedWage += Number(contract.wage) * (applicableDays / totalPeriodDays);
    }
    proratedWage = Math.round(proratedWage * 100) / 100;

    // ── 3. Expected working days from schedule ────────────────────────────────
    const workingDayNames = workingSchedule.workingDays as string[];
    const expectedWorkingDays = countWorkingDays(periodStart, periodEnd, workingDayNames);
    const dailyRate = expectedWorkingDays > 0
      ? Math.round((proratedWage / expectedWorkingDays) * 100) / 100
      : 0;

    // ── 4. Actual attendance ──────────────────────────────────────────────────
    const attendances = await prisma.attendance.findMany({
      where: { employeeId, date: { gte: periodStart, lte: periodEnd } },
    });

    const workedHours = attendances.reduce((sum, a) => sum + Number(a.workedHours), 0);

    // Count days present (PRESENT, LATE, EARLY_DEPARTURE all count as worked)
    const daysPresent = attendances.filter(
      (a) => ['PRESENT', 'LATE', 'EARLY_DEPARTURE'].includes(a.status)
    ).length;

    const absentDays = Math.max(0, expectedWorkingDays - daysPresent);

    // ── 5. Leave data ─────────────────────────────────────────────────────────
    const { paidLeaveDays, unpaidLeaveDays } = await getApprovedLeaveInPeriod(
      employeeId, periodStart, periodEnd
    );

    // Total paid leave allocation for this period (e.g. 20 days/year → prorated or full)
    const paidLeaveAllocated = await getPaidLeaveAllocationForPeriod(
      employeeId, periodStart, periodEnd
    );

    // ── 6. Calculate unpaid days ──────────────────────────────────────────────
    // Excess paid leave = paid leave taken beyond what is allocated
    const excessPaidLeave = Math.max(0, paidLeaveDays - paidLeaveAllocated);

    // Absent without any leave approved (absent days not covered by any leave)
    const totalLeaveDays = paidLeaveDays + unpaidLeaveDays;
    const absentWithoutLeave = Math.max(0, absentDays - totalLeaveDays);

    // Total days that must be deducted from salary
    const totalUnpaidDays = unpaidLeaveDays + excessPaidLeave + absentWithoutLeave;
    const unpaidDeductionAmount = Math.round(totalUnpaidDays * dailyRate * 100) / 100;

    const breakdown = {
      basicWage: proratedWage,
      expectedWorkingDays,
      dailyRate,
      actualDaysWorked: daysPresent,
      absentDays,
      paidLeaveTaken: paidLeaveDays,
      paidLeaveAllocated,
      unpaidLeaveTaken: unpaidLeaveDays,
      excessPaidLeave,
      absentWithoutLeave,
      totalUnpaidDays,
      unpaidDeductionAmount,
    };

    // ── 7. Build computed registry for rule execution ─────────────────────────
    const computed: Record<string, number> = {
      BASIC: proratedWage,
      WORKED_HOURS: workedHours,
      EXPECTED_DAYS: expectedWorkingDays,
      ACTUAL_DAYS: daysPresent,
      ABSENT_DAYS: absentDays,
      DAILY_RATE: dailyRate,
      PAID_LEAVE_TAKEN: paidLeaveDays,
      PAID_LEAVE_ALLOCATED: paidLeaveAllocated,
      UNPAID_LEAVE_TAKEN: unpaidLeaveDays,
      EXCESS_PAID_LEAVE: excessPaidLeave,
      ABSENT_WITHOUT_LEAVE: absentWithoutLeave,
      TOTAL_UNPAID_DAYS: totalUnpaidDays,
      UNPAID_DEDUCTION: unpaidDeductionAmount,
    };

    // ── 8. Execute salary rules in sequence order ─────────────────────────────
    const rules = salaryStructure.rules
      .filter((r) => r.isActive)
      .sort((a, b) => a.sequence - b.sequence);

    const lines: PayslipLineResult[] = [];

    for (const rule of rules) {
      const lineResult = executeRule(rule, computed, proratedWage, totalUnpaidDays, expectedWorkingDays, dailyRate, unpaidDeductionAmount);
      computed[rule.code] = lineResult.amount;
      lines.push({
        ruleId: rule.id,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        inputValues: lineResult.inputValues,
        formulaDescription: lineResult.formulaDescription,
        amount: lineResult.amount,
      });
    }

    // ── 9. Calculate final totals ─────────────────────────────────────────────
    const earningLines = lines.filter((l) => l.category === 'EARNING' && l.code !== 'GROSS');
    const deductionLines = lines.filter((l) => l.category === 'DEDUCTION');

    const gross = Math.round(earningLines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;
    const totalDeductions = Math.round(deductionLines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;
    const net = Math.round((gross - totalDeductions) * 100) / 100;

    // Finalise GROSS and NET placeholder lines
    for (const line of lines) {
      if (line.code === 'GROSS') {
        line.amount = gross;
        line.inputValues = { ...Object.fromEntries(earningLines.map((l) => [l.code, l.amount])) };
        line.formulaDescription = earningLines.map((l) => l.code).join(' + ');
      }
      if (line.code === 'NET') {
        line.amount = net;
        line.inputValues = { GROSS: gross, TOTAL_DEDUCTIONS: totalDeductions };
        line.formulaDescription = `GROSS (${gross}) − Total Deductions (${totalDeductions})`;
      }
    }

    return { employeeId, lines, gross, totalDeductions, net, computedAt: new Date(), hasError: false, breakdown };

  } catch (err) {
    return { ...result, hasError: true, errorMessage: err instanceof Error ? err.message : 'Unknown computation error' };
  }
}

/**
 * Execute a single salary rule.
 */
function executeRule(
  rule: SalaryRule,
  computed: Record<string, number>,
  basicWage: number,
  totalUnpaidDays: number,
  expectedDays: number,
  dailyRate: number,
  unpaidDeductionAmount: number,
): { amount: number; inputValues: Record<string, number>; formulaDescription: string } {
  const ruleValue = rule.value ? Number(rule.value) : 0;

  switch (rule.calculationType) {

    case 'FIXED':
      return {
        amount: ruleValue,
        inputValues: {},
        formulaDescription: rule.formulaDescription || `Fixed: ₹${ruleValue}`,
      };

    case 'PERCENTAGE': {
      const baseCode = rule.dependsOnCode ?? 'BASIC';
      const baseValue = computed[baseCode] ?? basicWage;
      const amount = Math.round((baseValue * ruleValue) / 100 * 100) / 100;
      return {
        amount,
        inputValues: { [baseCode]: baseValue },
        formulaDescription: rule.formulaDescription || `${baseCode} × ${ruleValue}%`,
      };
    }

    case 'REFERENCE': {
      // BASIC = prorated contract wage
      if (rule.code === 'BASIC') {
        return {
          amount: basicWage,
          inputValues: { wage: basicWage },
          formulaDescription: 'Contract wage (prorated if mid-period change)',
        };
      }

      // GROSS placeholder — recalculated after loop
      if (rule.code === 'GROSS') {
        return { amount: 0, inputValues: {}, formulaDescription: 'Sum of all earnings' };
      }

      // NET placeholder — recalculated after loop
      if (rule.code === 'NET') {
        return { amount: 0, inputValues: {}, formulaDescription: 'GROSS − Total Deductions' };
      }

      // UNPAID_LEAVE / UNPAID — uses the engine-computed deduction amount
      if (['UNPAID_LEAVE', 'UNPAID', 'ABSENT_DEDUCTION', 'LEAVE_DEDUCTION'].includes(rule.code)) {
        if (totalUnpaidDays === 0) {
          return {
            amount: 0,
            inputValues: {
              TOTAL_UNPAID_DAYS: 0,
              DAILY_RATE: dailyRate,
              PAID_LEAVE_ALLOCATED: computed.PAID_LEAVE_ALLOCATED,
              PAID_LEAVE_TAKEN: computed.PAID_LEAVE_TAKEN,
            },
            formulaDescription: 'No unpaid/excess leave this period',
          };
        }
        return {
          amount: unpaidDeductionAmount,
          inputValues: {
            DAILY_RATE: dailyRate,
            EXPECTED_DAYS: expectedDays,
            BASIC: basicWage,
            PAID_LEAVE_ALLOCATED: computed.PAID_LEAVE_ALLOCATED,
            PAID_LEAVE_TAKEN: computed.PAID_LEAVE_TAKEN,
            UNPAID_LEAVE_TAKEN: computed.UNPAID_LEAVE_TAKEN,
            EXCESS_PAID_LEAVE: computed.EXCESS_PAID_LEAVE,
            ABSENT_WITHOUT_LEAVE: computed.ABSENT_WITHOUT_LEAVE,
            TOTAL_UNPAID_DAYS: totalUnpaidDays,
          },
          formulaDescription:
            `DAILY_RATE × TOTAL_UNPAID_DAYS\n` +
            `= (BASIC ÷ EXPECTED_DAYS) × (UNPAID_LEAVE + EXCESS_PAID_LEAVE + ABSENT_WITHOUT_LEAVE)\n` +
            `= (${basicWage} ÷ ${expectedDays}) × ${totalUnpaidDays}\n` +
            `= ₹${dailyRate}/day × ${totalUnpaidDays} days`,
        };
      }

      // Reference to another computed rule
      const baseCode = rule.dependsOnCode ?? rule.code;
      const refValue = computed[baseCode] ?? 0;
      return {
        amount: refValue,
        inputValues: { [baseCode]: refValue },
        formulaDescription: rule.formulaDescription || `Reference: ${baseCode}`,
      };
    }

    default:
      return { amount: 0, inputValues: {}, formulaDescription: 'Unknown calculation type' };
  }
}
