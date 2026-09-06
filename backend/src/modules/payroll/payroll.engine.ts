/**
 * PeoplePay360 — Payroll Engine
 *
 * Deterministic salary rule executor.
 * Same inputs + same rules = same output. Always.
 *
 * This is the backend source of truth for salary calculation.
 * The frontend NEVER computes salary.
 */

import { SalaryRule, SalaryRuleCategory } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/prisma';
import { getApplicableContracts } from '../contracts/contracts.service';
import { getApprovedLeaveInPeriod } from '../timeoff/timeoff.service';
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
}

/**
 * Execute all salary rules for a single employee for a given payroll period.
 */
export async function computeEmployeePayroll(
  employeeId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PayrollComputationResult> {
  const result: PayrollComputationResult = {
    employeeId,
    lines: [],
    gross: 0,
    totalDeductions: 0,
    net: 0,
    computedAt: new Date(),
    hasError: false,
  };

  try {
    // 1. Resolve applicable contracts
    const { contracts: applicableContracts, isValid } = await getApplicableContracts(
      employeeId,
      periodStart,
      periodEnd
    );

    if (!isValid || applicableContracts.length === 0) {
      return {
        ...result,
        hasError: true,
        errorMessage: 'No applicable contract found for this payroll period',
      };
    }

    // 2. Use the primary (or only) contract for rule execution
    // For multi-contract periods, prorate the wage
    const primaryContract = applicableContracts[0].contract;
    const salaryStructure = primaryContract.salaryStructure;
    const workingSchedule = primaryContract.workingSchedule;

    // Calculate prorated base wage if multiple contracts apply
    let proratedWage = 0;
    const totalPeriodDays = applicableContracts[0].totalPeriodDays;

    for (const { contract, applicableDays } of applicableContracts) {
      const fraction = applicableDays / totalPeriodDays;
      proratedWage += Number(contract.wage) * fraction;
    }
    proratedWage = Math.round(proratedWage * 100) / 100;

    // 3. Load attendance for the period
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: periodStart, lte: periodEnd },
      },
    });

    const workedHours = attendances.reduce((sum, a) => sum + Number(a.workedHours), 0);

    // 4. Load approved leave
    const { totalDays: leaveDays } = await getApprovedLeaveInPeriod(employeeId, periodStart, periodEnd);

    // 5. Get working schedule expected days
    const workingDays = workingSchedule.workingDays as string[];
    const expectedWorkingDays = countWorkingDays(periodStart, periodEnd, workingDays);

    // 6. Execute salary rules in sequence order
    const rules = salaryStructure.rules.filter((r) => r.isActive).sort((a, b) => a.sequence - b.sequence);

    // Registry of computed values by rule code — used for rule dependencies
    const computed: Record<string, number> = {
      BASIC: proratedWage,
      WORKED_HOURS: workedHours,
      EXPECTED_DAYS: expectedWorkingDays,
      LEAVE_DAYS: leaveDays,
    };

    const lines: PayslipLineResult[] = [];

    for (const rule of rules) {
      const lineResult = executeRule(rule, computed, proratedWage, leaveDays, expectedWorkingDays);
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

    // 7. Calculate totals
    const earningLines = lines.filter((l) => l.category === 'EARNING' && l.code !== 'GROSS');
    const deductionLines = lines.filter((l) => l.category === 'DEDUCTION');

    const gross = Math.round(earningLines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;
    const totalDeductions = Math.round(deductionLines.reduce((sum, l) => sum + l.amount, 0) * 100) / 100;
    const net = Math.round((gross - totalDeductions) * 100) / 100;

    // Update GROSS and NET lines with computed values
    for (const line of lines) {
      if (line.code === 'GROSS') {
        line.amount = gross;
        line.inputValues = { ...computed, GROSS: gross };
        line.formulaDescription = earningLines.map((l) => l.code).join(' + ');
      }
      if (line.code === 'NET') {
        line.amount = net;
        line.inputValues = { GROSS: gross, TOTAL_DEDUCTIONS: totalDeductions };
        line.formulaDescription = `GROSS (${gross}) - Total Deductions (${totalDeductions})`;
      }
    }

    return {
      employeeId,
      lines,
      gross,
      totalDeductions,
      net,
      computedAt: new Date(),
      hasError: false,
    };
  } catch (err) {
    return {
      ...result,
      hasError: true,
      errorMessage: err instanceof Error ? err.message : 'Unknown computation error',
    };
  }
}

/**
 * Execute a single salary rule and return its computed amount + explanation.
 */
function executeRule(
  rule: SalaryRule,
  computed: Record<string, number>,
  basicWage: number,
  leaveDays: number,
  expectedDays: number
): { amount: number; inputValues: Record<string, number>; formulaDescription: string } {
  const ruleValue = rule.value ? Number(rule.value) : 0;

  switch (rule.calculationType) {
    case 'FIXED': {
      return {
        amount: ruleValue,
        inputValues: {},
        formulaDescription: rule.formulaDescription || `Fixed amount: ${ruleValue}`,
      };
    }

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
      // BASIC is always the contract wage
      if (rule.code === 'BASIC') {
        return {
          amount: basicWage,
          inputValues: { wage: basicWage },
          formulaDescription: 'Contract wage',
        };
      }

      // GROSS sums all earning lines — handled after the loop
      if (rule.code === 'GROSS') {
        return {
          amount: 0, // placeholder, recalculated after loop
          inputValues: {},
          formulaDescription: 'Sum of all earnings',
        };
      }

      // NET = GROSS - deductions — handled after the loop
      if (rule.code === 'NET') {
        return {
          amount: 0, // placeholder, recalculated after loop
          inputValues: {},
          formulaDescription: 'GROSS - Total Deductions',
        };
      }

      // UNPAID_LEAVE deduction
      if (rule.code === 'UNPAID_LEAVE' || rule.code === 'UNPAID') {
        if (leaveDays === 0 || expectedDays === 0) {
          return {
            amount: 0,
            inputValues: { BASIC: basicWage, LEAVE_DAYS: leaveDays, EXPECTED_DAYS: expectedDays },
            formulaDescription: 'No unpaid leave this period',
          };
        }
        const dailyRate = basicWage / expectedDays;
        const amount = Math.round(dailyRate * leaveDays * 100) / 100;
        return {
          amount,
          inputValues: { BASIC: basicWage, LEAVE_DAYS: leaveDays, EXPECTED_DAYS: expectedDays },
          formulaDescription: `(BASIC / EXPECTED_DAYS) × LEAVE_DAYS = (${basicWage} / ${expectedDays}) × ${leaveDays}`,
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
