import prisma from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuditService } from "./auditService.js";
import { TimeOffStatus, TimeOffUnit } from "@prisma/client";

export class TimeOffService {
  public static async getTimeOffTypes() {
    return prisma.timeOffType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  public static async createTimeOffType(
    data: { name: string; isPaid?: boolean; unit?: TimeOffUnit },
    actorId?: string
  ) {
    const existing = await prisma.timeOffType.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError(`Time-off type '${data.name}' already exists`, 409, "CONFLICT");
    }

    const type = await prisma.timeOffType.create({
      data: {
        name: data.name,
        isPaid: data.isPaid ?? true,
        unit: data.unit ?? "DAYS",
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "TIME_OFF_TYPE_CREATED",
      entityType: "TimeOffType",
      entityId: type.id,
      newData: type,
      reason: "Leave type created",
    });

    return type;
  }

  public static async getAllocations(employeeId?: string) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    return prisma.timeOffAllocation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: { id: true, employeeCode: true, name: true, department: true },
        },
        timeOffType: true,
      },
    });
  }

  public static async createAllocation(
    data: {
      employeeId: string;
      timeOffTypeId: string;
      allocatedDays: number;
      validFrom: string;
      validTo: string;
    },
    actorId?: string
  ) {
    const validFrom = new Date(data.validFrom);
    const validTo = new Date(data.validTo);

    if (validTo < validFrom) {
      throw new AppError("validTo cannot be before validFrom", 400, "INVALID_DATE_RANGE");
    }

    const allocation = await prisma.timeOffAllocation.create({
      data: {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        allocatedDays: data.allocatedDays,
        validFrom,
        validTo,
      },
      include: {
        timeOffType: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "TIME_OFF_ALLOCATED",
      entityType: "TimeOffAllocation",
      entityId: allocation.id,
      newData: allocation,
      reason: "Leave allocated to employee",
    });

    return allocation;
  }

  public static async getTimeOffBalance(employeeId: string) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new AppError("Employee not found", 404, "NOT_FOUND");
    }

    const types = await prisma.timeOffType.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const balances = await Promise.all(
      types.map(async (type) => {
        // Sum allocations
        const allocations = await prisma.timeOffAllocation.findMany({
          where: {
            employeeId,
            timeOffTypeId: type.id,
          },
        });

        const allocatedDays = allocations.reduce(
          (sum, a) => sum + Number(a.allocatedDays),
          0
        );

        // Sum approved requests
        const approvedRequests = await prisma.timeOffRequest.findMany({
          where: {
            employeeId,
            timeOffTypeId: type.id,
            status: "APPROVED",
          },
        });

        const usedDays = approvedRequests.reduce(
          (sum, r) => sum + Number(r.requestedDays),
          0
        );

        // Sum pending requests
        const pendingRequests = await prisma.timeOffRequest.findMany({
          where: {
            employeeId,
            timeOffTypeId: type.id,
            status: "SUBMITTED",
          },
        });

        const pendingDays = pendingRequests.reduce(
          (sum, r) => sum + Number(r.requestedDays),
          0
        );

        const remainingDays = Math.max(0, allocatedDays - usedDays);

        return {
          timeOffTypeId: type.id,
          name: type.name,
          isPaid: type.isPaid,
          unit: type.unit,
          allocatedDays,
          usedDays,
          pendingDays,
          remainingDays,
        };
      })
    );

    return balances;
  }

  public static async getRequests(filter: {
    employeeId?: string;
    status?: TimeOffStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.status) where.status = filter.status;

    const [total, items] = await Promise.all([
      prisma.timeOffRequest.count({ where }),
      prisma.timeOffRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          employee: {
            select: { id: true, employeeCode: true, name: true, department: true },
          },
          timeOffType: true,
          approver: {
            select: { id: true, email: true, role: true },
          },
        },
      }),
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

  public static async createRequest(
    data: {
      employeeId: string;
      timeOffTypeId: string;
      startDate: string;
      endDate: string;
      reason?: string;
    },
    actorId?: string
  ) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate < startDate) {
      throw new AppError("endDate cannot be before startDate", 400, "INVALID_DATE_RANGE");
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const requestedDays = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;

    // Balance check
    const balances = await this.getTimeOffBalance(data.employeeId);
    const balance = balances.find((b) => b.timeOffTypeId === data.timeOffTypeId);

    if (!balance || balance.remainingDays < requestedDays) {
      throw new AppError(
        `Insufficient leave balance. Requested: ${requestedDays} days, Remaining: ${
          balance ? balance.remainingDays : 0
        } days`,
        400,
        "INSUFFICIENT_LEAVE_BALANCE",
        {
          requestedDays,
          remainingDays: balance ? balance.remainingDays : 0,
        }
      );
    }

    const request = await prisma.timeOffRequest.create({
      data: {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        startDate,
        endDate,
        requestedDays,
        reason: data.reason,
        status: "SUBMITTED",
      },
      include: {
        timeOffType: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "TIME_OFF_REQUESTED",
      entityType: "TimeOffRequest",
      entityId: request.id,
      newData: request,
      reason: data.reason || "Time off request submitted",
    });

    return request;
  }

  public static async approveRequest(requestId: string, approverId?: string) {
    const request = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
      include: { timeOffType: true },
    });

    if (!request) {
      throw new AppError("Time off request not found", 404, "NOT_FOUND");
    }

    if (request.status !== "SUBMITTED") {
      throw new AppError(`Cannot approve request in ${request.status} status`, 400, "INVALID_STATUS");
    }

    const updated = await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approverId,
        approvedAt: new Date(),
      },
      include: {
        timeOffType: true,
        approver: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    await AuditService.log({
      userId: approverId,
      action: "TIME_OFF_APPROVED",
      entityType: "TimeOffRequest",
      entityId: requestId,
      oldData: { status: request.status },
      newData: { status: "APPROVED", approvedAt: updated.approvedAt },
      reason: "Time off request approved by manager",
    });

    return updated;
  }

  public static async rejectRequest(
    requestId: string,
    rejectionReason?: string,
    approverId?: string
  ) {
    const request = await prisma.timeOffRequest.findUnique({
      where: { id: requestId },
      include: { timeOffType: true },
    });

    if (!request) {
      throw new AppError("Time off request not found", 404, "NOT_FOUND");
    }

    if (request.status !== "SUBMITTED") {
      throw new AppError(`Cannot reject request in ${request.status} status`, 400, "INVALID_STATUS");
    }

    const updated = await prisma.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason,
        approverId,
        approvedAt: new Date(),
      },
      include: {
        timeOffType: true,
        approver: {
          select: { id: true, email: true, role: true },
        },
      },
    });

    await AuditService.log({
      userId: approverId,
      action: "TIME_OFF_REJECTED",
      entityType: "TimeOffRequest",
      entityId: requestId,
      oldData: { status: request.status },
      newData: { status: "REJECTED", rejectionReason },
      reason: rejectionReason || "Time off request rejected by manager",
    });

    return updated;
  }
}
