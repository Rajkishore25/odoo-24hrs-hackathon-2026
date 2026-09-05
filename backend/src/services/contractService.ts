import prisma from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuditService } from "./auditService.js";
import { ContractStatus } from "@prisma/client";

export interface ApplicableContractItem {
  id: string;
  startDate: string;
  endDate: string | null;
  wage: number;
  salaryStructureId: string;
  workingScheduleId: string;
  applicableDays: number;
  totalPeriodDays: number;
  prorationFactor: number;
}

export interface ApplicableContractResult {
  isValid: boolean;
  error?: string;
  isProrated: boolean;
  contracts: ApplicableContractItem[];
}

export class ContractService {
  public static async getContracts(filter: {
    employeeId?: string;
    status?: ContractStatus;
  }) {
    const where: any = {};
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.status) where.status = filter.status;

    return prisma.contract.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            email: true,
          },
        },
        salaryStructure: true,
        workingSchedule: true,
      },
    });
  }

  public static async getContractsByEmployeeId(employeeId: string) {
    return this.getContracts({ employeeId });
  }

  public static async getContractById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        employee: true,
        salaryStructure: true,
        workingSchedule: true,
      },
    });

    if (!contract) {
      throw new AppError("Contract not found", 404, "NOT_FOUND");
    }

    return contract;
  }

  public static checkDateOverlap(
    startA: Date,
    endA: Date | null,
    startB: Date,
    endB: Date | null
  ): boolean {
    const effectiveEndA = endA ? endA.getTime() : Infinity;
    const effectiveEndB = endB ? endB.getTime() : Infinity;

    return startA.getTime() <= effectiveEndB && effectiveEndA >= startB.getTime();
  }

  public static async createContract(
    data: {
      employeeId: string;
      startDate: string;
      endDate?: string | null;
      wage: number;
      salaryStructureId: string;
      workingScheduleId: string;
      status?: ContractStatus;
    },
    actorId?: string
  ) {
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new AppError("Contract endDate cannot be before startDate", 400, "INVALID_CONTRACT_DATES");
    }

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: data.employeeId },
    });
    if (!employee) {
      throw new AppError("Employee not found", 404, "NOT_FOUND");
    }

    const status = data.status || "DRAFT";

    // If contract status is ACTIVE, check for overlapping active contracts
    if (status === "ACTIVE") {
      const activeContracts = await prisma.contract.findMany({
        where: {
          employeeId: data.employeeId,
          status: "ACTIVE",
        },
      });

      for (const existing of activeContracts) {
        if (this.checkDateOverlap(startDate, endDate, existing.startDate, existing.endDate)) {
          throw new AppError(
            `Contract dates overlap with existing active contract (${existing.id})`,
            409,
            "OVERLAPPING_CONTRACT"
          );
        }
      }
    }

    const contract = await prisma.contract.create({
      data: {
        employeeId: data.employeeId,
        startDate,
        endDate,
        wage: data.wage,
        salaryStructureId: data.salaryStructureId,
        workingScheduleId: data.workingScheduleId,
        status,
      },
      include: {
        salaryStructure: true,
        workingSchedule: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "CONTRACT_CREATED",
      entityType: "Contract",
      entityId: contract.id,
      newData: contract,
      reason: "Employment contract created",
    });

    return contract;
  }

  public static async updateContract(
    id: string,
    data: Partial<{
      startDate: string;
      endDate: string | null;
      wage: number;
      salaryStructureId: string;
      workingScheduleId: string;
      status: ContractStatus;
    }>,
    actorId?: string
  ) {
    const existing = await this.getContractById(id);

    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existing.endDate;

    if (endDate && endDate < startDate) {
      throw new AppError("Contract endDate cannot be before startDate", 400, "INVALID_CONTRACT_DATES");
    }

    const newStatus = data.status || existing.status;

    if (newStatus === "ACTIVE") {
      const otherActiveContracts = await prisma.contract.findMany({
        where: {
          employeeId: existing.employeeId,
          status: "ACTIVE",
          id: { not: id },
        },
      });

      for (const other of otherActiveContracts) {
        if (this.checkDateOverlap(startDate, endDate, other.startDate, other.endDate)) {
          throw new AppError(
            `Updated contract dates overlap with active contract (${other.id})`,
            409,
            "OVERLAPPING_CONTRACT"
          );
        }
      }
    }

    const updatePayload: any = { ...data };
    if (data.startDate) updatePayload.startDate = startDate;
    if (data.endDate !== undefined) updatePayload.endDate = endDate;

    const updated = await prisma.contract.update({
      where: { id },
      data: updatePayload,
      include: {
        salaryStructure: true,
        workingSchedule: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "CONTRACT_UPDATED",
      entityType: "Contract",
      entityId: id,
      oldData: existing,
      newData: updated,
      reason: "Employment contract updated",
    });

    return updated;
  }

  /**
   * Deterministic Contract Period Intelligence:
   * Resolves valid contracts for a given payroll period, detects gaps or overlaps, and calculates proration.
   */
  public static async getApplicableContracts(
    employeeId: string,
    periodStartStr: string,
    periodEndStr: string
  ): Promise<ApplicableContractResult> {
    const periodStart = new Date(periodStartStr);
    const periodEnd = new Date(periodEndStr);

    if (periodStart > periodEnd) {
      throw new AppError("periodStart cannot be after periodEnd", 400, "INVALID_PERIOD");
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalPeriodDays = Math.round((periodEnd.getTime() - periodStart.getTime()) / msPerDay) + 1;

    // Fetch contracts overlapping the payroll period that are not CANCELLED
    const contracts = await prisma.contract.findMany({
      where: {
        employeeId,
        status: { in: ["ACTIVE", "EXPIRED", "DRAFT"] },
        startDate: { lte: periodEnd },
        OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
      },
      orderBy: { startDate: "asc" },
    });

    if (contracts.length === 0) {
      return {
        isValid: false,
        error: "No applicable contract found for this payroll period",
        isProrated: false,
        contracts: [],
      };
    }

    // Filter to ACTIVE contracts if available, otherwise check contracts
    const activeContracts = contracts.filter((c) => c.status === "ACTIVE");
    const evaluatedContracts = activeContracts.length > 0 ? activeContracts : contracts;

    // Check for overlaps among applicable contracts
    for (let i = 0; i < evaluatedContracts.length; i++) {
      for (let j = i + 1; j < evaluatedContracts.length; j++) {
        const c1 = evaluatedContracts[i];
        const c2 = evaluatedContracts[j];
        if (this.checkDateOverlap(c1.startDate, c1.endDate, c2.startDate, c2.endDate)) {
          return {
            isValid: false,
            error: `Overlapping contracts detected for employee (${c1.id} and ${c2.id})`,
            isProrated: false,
            contracts: [],
          };
        }
      }
    }

    const resultItems: ApplicableContractItem[] = [];
    let coveredDaysSum = 0;

    for (const c of evaluatedContracts) {
      const effectiveStart = c.startDate > periodStart ? c.startDate : periodStart;
      const cEnd = c.endDate ? c.endDate : periodEnd;
      const effectiveEnd = cEnd < periodEnd ? cEnd : periodEnd;

      const applicableDays = Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / msPerDay) + 1;

      if (applicableDays > 0) {
        coveredDaysSum += applicableDays;
        const prorationFactor = Math.round((applicableDays / totalPeriodDays) * 10000) / 10000;

        resultItems.push({
          id: c.id,
          startDate: c.startDate.toISOString().split("T")[0],
          endDate: c.endDate ? c.endDate.toISOString().split("T")[0] : null,
          wage: Number(c.wage),
          salaryStructureId: c.salaryStructureId,
          workingScheduleId: c.workingScheduleId,
          applicableDays,
          totalPeriodDays,
          prorationFactor,
        });
      }
    }

    const isProrated = resultItems.length > 1 || (resultItems.length === 1 && coveredDaysSum < totalPeriodDays);

    return {
      isValid: true,
      isProrated,
      contracts: resultItems,
    };
  }
}
