import { db } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuditService } from "./auditService.js";
import { PayrollEngine } from "./payrollEngine.js";
import { ValidationEngine } from "./validationEngine.js";
import { CreatePayrunInput } from "../validations/payrunValidation.js";

export class PayrunService {
  /**
   * Creates a new payrun in DRAFT status.
   */
  static async createPayrun(input: CreatePayrunInput, userId: string) {
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);

    // Resolve employee list: if none provided, fetch all active employees
    let employeeIds = input.employeeIds;
    if (!employeeIds || employeeIds.length === 0) {
      const activeEmployees = await db.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true },
      });
      employeeIds = activeEmployees.map((e) => e.id);
    }

    if (employeeIds.length === 0) {
      throw new AppError("No active employees found for payrun scope", 400, "NO_EMPLOYEES");
    }

    const payrunName =
      input.name ||
      `Payrun ${periodStart.toISOString().slice(0, 7)}`;

    const payrun = await db.payrun.create({
      data: {
        name: payrunName,
        periodStart,
        periodEnd,
        status: "DRAFT",
        createdBy: userId,
      },
    });

    await AuditService.log({
      userId,
      action: "PAYRUN_CREATED",
      entityType: "Payrun",
      entityId: payrun.id,
      newData: { id: payrun.id, name: payrunName, employeeCount: employeeIds.length },
      reason: "Payrun initialized",
    });

    return {
      ...payrun,
      employeeCount: employeeIds.length,
      employeeIds,
    };
  }

  /**
   * Retrieves list of payruns with pagination and filtering.
   */
  static async getPayruns(query: { status?: any; page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      db.payrun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { payslips: true } },
        },
      }),
      db.payrun.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves single payrun by ID.
   */
  static async getPayrunById(id: string) {
    const payrun = await db.payrun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                name: true,
                department: true,
                designation: true,
              },
            },
          },
        },
      },
    });

    if (!payrun) {
      throw new AppError("Payrun not found", 404, "NOT_FOUND");
    }

    return payrun;
  }

  /**
   * Computes draft payslips and explainable lines idempotently for all employees.
   */
  static async computePayrun(id: string, userId?: string) {
    const payrun = await this.getPayrunById(id);

    if (payrun.status === "FINALIZED" || payrun.status === "PAID") {
      throw new AppError(
        `Cannot recompute payrun in ${payrun.status} status`,
        400,
        "INVALID_PAYRUN_STATE"
      );
    }

    // Fetch active employees
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, employeeCode: true },
    });

    let overallGross = 0;
    let overallDeductions = 0;
    let overallNet = 0;
    const computedPayslips = [];

    // Compute for each employee inside a transaction for safety
    await db.$transaction(async (tx) => {
      // 1. Delete existing payslip lines and payslips for this draft payrun (idempotency)
      await tx.payslipLine.deleteMany({
        where: { payslip: { payrunId: id } },
      });
      await tx.payslip.deleteMany({
        where: { payrunId: id },
      });

      // 2. Compute each employee
      for (const emp of employees) {
        try {
          const result = await PayrollEngine.computeEmployeePayslip(
            emp.id,
            payrun.periodStart,
            payrun.periodEnd
          );

          const payslip = await tx.payslip.create({
            data: {
              payrunId: id,
              employeeId: emp.id,
              status: "COMPUTED",
              gross: result.gross,
              totalDeductions: result.totalDeductions,
              net: result.net,
            },
          });

          // Insert explainable snapshot lines
          if (result.lines.length > 0) {
            await tx.payslipLine.createMany({
              data: result.lines.map((l) => ({
                payslipId: payslip.id,
                ruleId: l.ruleId || null,
                code: l.code,
                name: l.name,
                category: l.category,
                sequence: l.sequence,
                inputValues: l.inputValues,
                formulaDescription: l.formulaDescription,
                amount: l.amount,
              })),
            });
          }

          overallGross += result.gross;
          overallDeductions += result.totalDeductions;
          overallNet += result.net;
          computedPayslips.push(payslip);
        } catch (err: any) {
          // If individual employee fails (e.g. missing contract), continue but don't stop whole compute
          console.warn(`[Payroll Compute] Skipped employee ${emp.employeeCode}: ${err.message}`);
        }
      }

      // 3. Update Payrun totals and status
      await tx.payrun.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          totalGross: overallGross,
          totalDeductions: overallDeductions,
          totalNet: overallNet,
        },
      });
    });

    await AuditService.log({
      userId,
      action: "PAYRUN_COMPUTED",
      entityType: "Payrun",
      entityId: id,
      newData: {
        totalGross: overallGross,
        totalDeductions: overallDeductions,
        totalNet: overallNet,
        payslipsCount: computedPayslips.length,
      },
      reason: "Computed draft payslips for payrun",
    });

    return {
      payrunId: id,
      status: "IN_PROGRESS",
      totalGross: overallGross,
      totalDeductions: overallDeductions,
      totalNet: overallNet,
      employeeCount: computedPayslips.length,
    };
  }

  /**
   * Validates payrun data against business rules and identifies critical blockers or warnings.
   */
  static async validatePayrun(id: string, userId?: string) {
    const payrun = await this.getPayrunById(id);

    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    const employeeIds = employees.map((e) => e.id);

    const validationResult = await ValidationEngine.validate(
      payrun.periodStart,
      payrun.periodEnd,
      employeeIds
    );

    // If clean, update status to VALIDATED; if blocked, ensure status is IN_PROGRESS
    const newStatus = validationResult.criticalErrors.length === 0 ? "VALIDATED" : "IN_PROGRESS";
    await db.payrun.update({
      where: { id },
      data: { status: newStatus },
    });

    return validationResult;
  }

  /**
   * Finalizes the payrun inside an atomic transaction.
   * STRICTLY BLOCKED if critical validation errors exist.
   */
  static async finalizePayrun(id: string, userId: string) {
    const payrun = await this.getPayrunById(id);

    if (payrun.status === "FINALIZED" || payrun.status === "PAID") {
      throw new AppError("Payrun is already finalized", 400, "ALREADY_FINALIZED");
    }

    // 1. Run Validation check
    const employees = await db.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });
    const employeeIds = employees.map((e) => e.id);

    const validation = await ValidationEngine.validate(
      payrun.periodStart,
      payrun.periodEnd,
      employeeIds
    );

    if (validation.criticalErrors.length > 0) {
      throw new AppError(
        `Finalization blocked by ${validation.criticalErrors.length} critical validation error(s). First error: ${validation.criticalErrors[0].message}`,
        422,
        "PAYRUN_BLOCKED"
      );
    }

    // 2. Perform Atomic Finalization
    const finalized = await db.$transaction(async (tx) => {
      const updated = await tx.payrun.update({
        where: { id },
        data: {
          status: "FINALIZED",
          finalizedAt: new Date(),
        },
      });

      // Freeze all payslips
      await tx.payslip.updateMany({
        where: { payrunId: id },
        data: { status: "VALIDATED" },
      });

      return updated;
    });

    await AuditService.log({
      userId,
      action: "PAYRUN_FINALIZED",
      entityType: "Payrun",
      entityId: id,
      newData: { status: "FINALIZED", finalizedAt: finalized.finalizedAt },
      reason: "Payrun successfully validated and finalized",
    });

    return {
      message: "Payrun finalized successfully. Payslips frozen.",
      payrun: finalized,
    };
  }

  /**
   * List payslips for a specific payrun.
   */
  static async getPayrunPayslips(id: string) {
    return db.payslip.findMany({
      where: { payrunId: id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            department: true,
            designation: true,
          },
        },
        lines: {
          orderBy: { sequence: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }
}

export default PayrunService;
