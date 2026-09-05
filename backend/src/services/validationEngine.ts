import { db } from "../config/database.js";

export interface ValidationErrorItem {
  code: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  message: string;
}

export interface ValidationResult {
  status: "BLOCKED" | "VALID";
  criticalErrors: ValidationErrorItem[];
  warnings: ValidationErrorItem[];
  summary: {
    employeesChecked: number;
    criticalCount: number;
    warningCount: number;
  };
}

export class ValidationEngine {
  /**
   * Validates all employees in a payrun period and identifies blocking critical issues or warnings.
   */
  static async validate(
    periodStart: Date,
    periodEnd: Date,
    employeeIds: string[]
  ): Promise<ValidationResult> {
    const criticalErrors: ValidationErrorItem[] = [];
    const warnings: ValidationErrorItem[] = [];

    const employees = await db.employee.findMany({
      where: {
        id: { in: employeeIds },
        status: "ACTIVE",
      },
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
                },
              },
            },
          },
        },
        attendanceExceptions: {
          where: {
            status: "OPEN",
            attendance: {
              date: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
          },
        },
        timeOffRequests: {
          where: {
            status: "SUBMITTED",
            startDate: { lte: periodEnd },
            endDate: { gte: periodStart },
          },
        },
      },
    });

    for (const emp of employees) {
      // 1. Critical: Check for Applicable Active Contract
      if (!emp.contracts || emp.contracts.length === 0) {
        criticalErrors.push({
          code: "NO_ACTIVE_CONTRACT",
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.name,
          message: `No active or applicable contract found for period ${periodStart.toISOString().split("T")[0]} to ${periodEnd.toISOString().split("T")[0]}`,
        });
        continue;
      }

      const activeContract = emp.contracts[0];

      // 2. Critical: Check for Valid Salary Structure & Rules
      if (!activeContract.salaryStructure || activeContract.salaryStructure.rules.length === 0) {
        criticalErrors.push({
          code: "MISSING_SALARY_STRUCTURE",
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          employeeName: emp.name,
          message: `Contract ${activeContract.id} is missing an active salary structure with calculation rules`,
        });
      }

      // 3. Warning: Unresolved Attendance Exceptions
      if (emp.attendanceExceptions && emp.attendanceExceptions.length > 0) {
        for (const exc of emp.attendanceExceptions) {
          warnings.push({
            code: "ATTENDANCE_EXCEPTION",
            employeeId: emp.id,
            employeeCode: emp.employeeCode,
            employeeName: emp.name,
            message: `Unresolved attendance exception (${exc.type}): ${exc.reason || "Missing punch or abnormal hours"}`,
          });
        }
      }

      // 4. Warning: Pending (Unapproved) Leave Requests
      if (emp.timeOffRequests && emp.timeOffRequests.length > 0) {
        for (const leave of emp.timeOffRequests) {
          warnings.push({
            code: "UNAPPROVED_LEAVE",
            employeeId: emp.id,
            employeeCode: emp.employeeCode,
            employeeName: emp.name,
            message: `Pending leave request from ${leave.startDate.toISOString().split("T")[0]} to ${leave.endDate.toISOString().split("T")[0]} requires manager action`,
          });
        }
      }
    }

    // Check for employees requested who don't exist or are inactive
    for (const requestedId of employeeIds) {
      const found = employees.some((e) => e.id === requestedId);
      if (!found) {
        criticalErrors.push({
          code: "INACTIVE_OR_MISSING_EMPLOYEE",
          employeeId: requestedId,
          message: "Employee does not exist or is not in ACTIVE status",
        });
      }
    }

    return {
      status: criticalErrors.length > 0 ? "BLOCKED" : "VALID",
      criticalErrors,
      warnings,
      summary: {
        employeesChecked: employeeIds.length,
        criticalCount: criticalErrors.length,
        warningCount: warnings.length,
      },
    };
  }
}

export default ValidationEngine;
