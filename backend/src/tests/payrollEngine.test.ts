import { describe, it, expect, vi } from "vitest";
import { PayrollEngine } from "../services/payrollEngine.js";
import { db } from "../config/database.js";

describe("Phase 3 — Deterministic Payroll Engine", () => {
  it("should compute salary rules sequentially: Basic + HRA (20%) - PF (12%)", async () => {
    // Mock employee with contract & salary structure
    const mockEmployee = {
      id: "emp-101",
      name: "Rahul Kumar",
      contracts: [
        {
          id: "contract-1",
          wage: 50000,
          startDate: new Date("2026-01-01"),
          endDate: null,
          salaryStructure: {
            rules: [
              {
                id: "rule-1",
                code: "BASIC",
                name: "Basic Wage",
                category: "EARNING",
                sequence: 10,
                calculationType: "FIXED",
                value: null,
                dependsOnCode: null,
                formulaDescription: "Full contract wage",
              },
              {
                id: "rule-2",
                code: "HRA",
                name: "House Rent Allowance",
                category: "EARNING",
                sequence: 20,
                calculationType: "PERCENTAGE",
                value: 20,
                dependsOnCode: "BASIC",
                formulaDescription: "20% of BASIC",
              },
              {
                id: "rule-3",
                code: "PF",
                name: "Provident Fund",
                category: "DEDUCTION",
                sequence: 30,
                calculationType: "PERCENTAGE",
                value: 12,
                dependsOnCode: "BASIC",
                formulaDescription: "12% of BASIC",
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(db.employee, "findUnique").mockResolvedValueOnce(mockEmployee as any);
    vi.spyOn(db.timeOffRequest, "findMany").mockResolvedValueOnce([]);

    const periodStart = new Date("2026-09-01");
    const periodEnd = new Date("2026-09-30");

    const result = await PayrollEngine.computeEmployeePayslip(
      "emp-101",
      periodStart,
      periodEnd
    );

    // Basic = 50,000
    // HRA = 20% of 50,000 = 10,000
    // PF = 12% of 50,000 = 6,000
    // Gross = 60,000
    // Total Deductions = 6,000
    // Net = 54,000
    expect(result.gross).toBe(60000);
    expect(result.totalDeductions).toBe(6000);
    expect(result.net).toBe(54000);

    // Verify explainable lines
    const basicLine = result.lines.find((l) => l.code === "BASIC");
    expect(basicLine?.amount).toBe(50000);

    const hraLine = result.lines.find((l) => l.code === "HRA");
    expect(hraLine?.amount).toBe(10000);
    expect(hraLine?.inputValues["BASIC"]).toBe(50000);

    const pfLine = result.lines.find((l) => l.code === "PF");
    expect(pfLine?.amount).toBe(6000);

    const netLine = result.lines.find((l) => l.code === "NET");
    expect(netLine?.amount).toBe(54000);
  });

  it("should deduct approved unpaid leave from total take-home pay", async () => {
    const mockEmployee = {
      id: "emp-102",
      name: "Anita Roy",
      contracts: [
        {
          id: "contract-2",
          wage: 30000,
          startDate: new Date("2026-01-01"),
          endDate: null,
          salaryStructure: {
            rules: [
              {
                id: "rule-1",
                code: "BASIC",
                name: "Basic Wage",
                category: "EARNING",
                sequence: 10,
                calculationType: "FIXED",
                value: null,
                dependsOnCode: null,
                formulaDescription: null,
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(db.employee, "findUnique").mockResolvedValueOnce(mockEmployee as any);

    // 2 days unpaid leave in 30-day month = (30000/30) * 2 = 2,000 deduction
    vi.spyOn(db.timeOffRequest, "findMany").mockResolvedValueOnce([
      { requestedDays: 2, timeOffType: { isPaid: false } },
    ] as any);

    const result = await PayrollEngine.computeEmployeePayslip(
      "emp-102",
      new Date("2026-09-01"),
      new Date("2026-09-30")
    );

    expect(result.gross).toBe(30000);
    expect(result.totalDeductions).toBe(2000);
    expect(result.net).toBe(28000);

    const unpaidLine = result.lines.find((l) => l.code === "UNPAID_LEAVE");
    expect(unpaidLine).toBeDefined();
    expect(unpaidLine?.amount).toBe(2000);
  });
});
