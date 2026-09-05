import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { ValidationEngine } from "../services/validationEngine.js";
import { PayrunService } from "../services/payrunService.js";
import { db } from "../config/database.js";

describe("Phase 3 — Validation Cockpit & Hard Finalization Blocking", () => {
  it("should flag NO_ACTIVE_CONTRACT as CRITICAL and mark status as BLOCKED", async () => {
    // Mock employee with NO active contract
    vi.spyOn(db.employee, "findMany").mockResolvedValueOnce([
      {
        id: "emp-priya",
        employeeCode: "EMP002",
        name: "Priya Sharma",
        contracts: [], // No contract!
        attendanceExceptions: [],
        timeOffRequests: [],
      },
    ] as any);

    const periodStart = new Date("2026-09-01");
    const periodEnd = new Date("2026-09-30");

    const result = await ValidationEngine.validate(periodStart, periodEnd, ["emp-priya"]);

    expect(result.status).toBe("BLOCKED");
    expect(result.summary.criticalCount).toBe(1);
    expect(result.criticalErrors[0].code).toBe("NO_ACTIVE_CONTRACT");
    expect(result.criticalErrors[0].employeeCode).toBe("EMP002");
  });

  it("should flag open attendance punch exceptions as WARNING", async () => {
    vi.spyOn(db.employee, "findMany").mockResolvedValueOnce([
      {
        id: "emp-amit",
        employeeCode: "EMP003",
        name: "Amit Verma",
        contracts: [
          {
            id: "c-1",
            salaryStructure: { rules: [{ id: "r-1" }] },
          },
        ],
        attendanceExceptions: [
          {
            id: "exc-1",
            type: "UNUSUAL_HOURS",
            status: "OPEN",
            reason: "Excessive shift duration of 14.5 hours",
          },
        ],
        timeOffRequests: [],
      },
    ] as any);

    const result = await ValidationEngine.validate(
      new Date("2026-09-01"),
      new Date("2026-09-30"),
      ["emp-amit"]
    );

    expect(result.status).toBe("VALID"); // No critical errors
    expect(result.summary.warningCount).toBe(1);
    expect(result.warnings[0].code).toBe("ATTENDANCE_EXCEPTION");
  });

  it("should strictly block finalization if critical errors exist (HTTP 422 PAYRUN_BLOCKED)", async () => {
    vi.spyOn(PayrunService, "getPayrunById").mockResolvedValueOnce({
      id: "payrun-1",
      periodStart: new Date("2026-09-01"),
      periodEnd: new Date("2026-09-30"),
      status: "IN_PROGRESS",
    } as any);

    vi.spyOn(db.employee, "findMany").mockResolvedValueOnce([
      { id: "emp-priya" },
    ] as any);

    vi.spyOn(ValidationEngine, "validate").mockResolvedValueOnce({
      status: "BLOCKED",
      criticalErrors: [
        {
          code: "NO_ACTIVE_CONTRACT",
          employeeId: "emp-priya",
          message: "No applicable contract found for period",
        },
      ],
      warnings: [],
      summary: {
        employeesChecked: 1,
        criticalCount: 1,
        warningCount: 0,
      },
    });

    await expect(
      PayrunService.finalizePayrun("payrun-1", "test-user")
    ).rejects.toThrow(/Finalization blocked by 1 critical validation error/);
  });

  describe("Phase 3 API Endpoints", () => {
    it("GET /api/dashboard should return dashboard KPIs and status envelope", async () => {
      vi.spyOn(db.employee, "count").mockResolvedValueOnce(3);
      vi.spyOn(db.timeOffRequest, "count").mockResolvedValueOnce(1);
      vi.spyOn(db.attendanceException, "count").mockResolvedValueOnce(1);
      vi.spyOn(db.payrun, "findFirst").mockResolvedValueOnce(null);
      vi.spyOn(db.payrun, "findMany").mockResolvedValueOnce([]);

      const res = await request(app).get("/api/dashboard");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employees.activeCount).toBe(3);
      expect(res.body.data.alerts.pendingLeaveCount).toBe(1);
    });

    it("GET /api/salary-structures should return list of structures", async () => {
      vi.spyOn(db.salaryStructure, "findMany").mockResolvedValueOnce([
        {
          id: "struct-1",
          name: "Standard Corporate Structure",
          rules: [],
          _count: { contracts: 2 },
        },
      ] as any);

      const res = await request(app).get("/api/salary-structures");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe("Standard Corporate Structure");
    });
  });
});
