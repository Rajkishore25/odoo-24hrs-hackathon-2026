import { db } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";

export interface ComputedPayslipLine {
  ruleId?: string;
  code: string;
  name: string;
  category: "EARNING" | "DEDUCTION" | "NET";
  sequence: number;
  inputValues: Record<string, any>;
  formulaDescription: string | null;
  amount: number;
}

export interface ComputedPayslipResult {
  employeeId: string;
  gross: number;
  totalDeductions: number;
  net: number;
  lines: ComputedPayslipLine[];
}

export class PayrollEngine {
  /**
   * Computes deterministic payslip for an employee across a specified payroll period.
   */
  static async computeEmployeePayslip(
    employeeId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComputedPayslipResult> {
    // 1. Fetch employee and applicable contracts
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        contracts: {
          where: {
            status: "ACTIVE",
            startDate: { lte: periodEnd },
            OR: [
              { endDate: null },
              { endDate: { gte: periodStart } },
            ],
          },
          include: {
            salaryStructure: {
              include: {
                rules: {
                  where: { isActive: true },
                  orderBy: { sequence: "asc" },
                },
              },
            },
            workingSchedule: true,
          },
        },
      },
    });

    if (!employee || !employee.contracts || employee.contracts.length === 0) {
      throw new AppError(
        `Employee ${employeeId} has no active contract for this period`,
        400,
        "NO_ACTIVE_CONTRACT"
      );
    }

    const contract = employee.contracts[0];
    if (!contract.salaryStructure || contract.salaryStructure.rules.length === 0) {
      throw new AppError(
        `Contract for ${employee.name} lacks active salary rules`,
        400,
        "MISSING_SALARY_STRUCTURE"
      );
    }

    // 2. Calculate period duration & contract proration
    const periodDays = Math.max(
      1,
      Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const cStart = contract.startDate > periodStart ? contract.startDate : periodStart;
    const cEnd = contract.endDate && contract.endDate < periodEnd ? contract.endDate : periodEnd;
    const applicableDays = Math.max(
      1,
      Math.ceil((cEnd.getTime() - cStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const contractWage = Number(contract.wage);
    const prorationRatio = Math.min(1, applicableDays / periodDays);
    const baseProratedWage = Math.round(contractWage * prorationRatio * 100) / 100;

    // 3. Load approved unpaid leaves within period
    const approvedUnpaidLeaves = await db.timeOffRequest.findMany({
      where: {
        employeeId,
        status: "APPROVED",
        startDate: { lte: periodEnd },
        endDate: { gte: periodStart },
        timeOffType: { isPaid: false },
      },
    });

    const unpaidDays = approvedUnpaidLeaves.reduce((sum, r) => sum + Number(r.requestedDays), 0);
    const dailyWage = baseProratedWage / periodDays;
    const unpaidLeaveDeduction = Math.round(dailyWage * unpaidDays * 100) / 100;

    // 4. Sequential salary rule evaluation
    const ruleResults: Record<string, number> = {};
    const lines: ComputedPayslipLine[] = [];

    let gross = 0;
    let totalDeductions = 0;

    for (const rule of contract.salaryStructure.rules) {
      let amount = 0;
      const inputValues: Record<string, any> = {};
      let formula = rule.formulaDescription;

      switch (rule.calculationType) {
        case "FIXED":
          if (rule.code === "BASIC") {
            amount = baseProratedWage;
            inputValues["ContractWage"] = contractWage;
            inputValues["ProrationDays"] = applicableDays;
            inputValues["PeriodDays"] = periodDays;
            formula = formula || `Contract Wage ${contractWage} prorated for ${applicableDays}/${periodDays} days`;
          } else {
            amount = rule.value ? Number(rule.value) : 0;
            inputValues["Value"] = amount;
          }
          break;

        case "PERCENTAGE":
          if (rule.dependsOnCode && ruleResults[rule.dependsOnCode] !== undefined) {
            const baseValue = ruleResults[rule.dependsOnCode];
            const percent = rule.value ? Number(rule.value) : 0;
            amount = Math.round((baseValue * (percent / 100)) * 100) / 100;
            inputValues[rule.dependsOnCode] = baseValue;
            inputValues["Percentage"] = `${percent}%`;
            formula = formula || `${percent}% of ${rule.dependsOnCode} (${baseValue})`;
          } else {
            amount = 0;
          }
          break;

        case "REFERENCE":
          if (rule.dependsOnCode && ruleResults[rule.dependsOnCode] !== undefined) {
            amount = ruleResults[rule.dependsOnCode];
            inputValues[rule.dependsOnCode] = amount;
          }
          break;
      }

      ruleResults[rule.code] = amount;

      if (rule.category === "EARNING") {
        gross += amount;
      } else if (rule.category === "DEDUCTION") {
        totalDeductions += amount;
      }

      lines.push({
        ruleId: rule.id,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        sequence: rule.sequence,
        inputValues,
        formulaDescription: formula,
        amount,
      });
    }

    // 5. Add Unpaid Leave deduction line if unpaid leave occurred
    if (unpaidLeaveDeduction > 0) {
      totalDeductions += unpaidLeaveDeduction;
      lines.push({
        code: "UNPAID_LEAVE",
        name: "Unpaid Leave Deduction",
        category: "DEDUCTION",
        sequence: 90,
        inputValues: {
          unpaidDays,
          dailyWage: Math.round(dailyWage * 100) / 100,
        },
        formulaDescription: `${unpaidDays} days × daily rate ₹${dailyWage.toFixed(2)}`,
        amount: unpaidLeaveDeduction,
      });
    }

    gross = Math.round(gross * 100) / 100;
    totalDeductions = Math.round(totalDeductions * 100) / 100;
    const net = Math.round((gross - totalDeductions) * 100) / 100;

    // Add Net summary line
    lines.push({
      code: "NET",
      name: "Net Payable Salary",
      category: "NET",
      sequence: 100,
      inputValues: { Gross: gross, TotalDeductions: totalDeductions },
      formulaDescription: `Gross (${gross}) - Total Deductions (${totalDeductions})`,
      amount: net,
    });

    return {
      employeeId,
      gross,
      totalDeductions,
      net,
      lines,
    };
  }
}

export default PayrollEngine;
