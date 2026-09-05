import prisma from "../config/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { AuditService } from "./auditService.js";
import { EmployeeStatus } from "../config/constants.js";

export { EmployeeStatus };

export class EmployeeService {
  public static async getEmployees(query: {
    search?: string;
    department?: string;
    status?: EmployeeStatus;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.department) {
      where.department = query.department;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { employeeCode: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            include: {
              workingSchedule: true,
              salaryStructure: true,
            },
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

  public static async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        contracts: {
          orderBy: { startDate: "desc" },
          include: {
            workingSchedule: true,
            salaryStructure: true,
          },
        },
        timeOffAllocations: {
          include: {
            timeOffType: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppError("Employee not found", 404, "NOT_FOUND");
    }

    return employee;
  }

  public static async createEmployee(
    data: {
      employeeCode: string;
      name: string;
      email: string;
      phone?: string;
      department?: string;
      designation?: string;
      joiningDate: string;
      status?: EmployeeStatus;
      bankAccountNumber?: string;
      bankName?: string;
      userId?: string;
    },
    actorId?: string
  ) {
    // Check employee code uniqueness
    const existing = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode },
    });

    if (existing) {
      throw new AppError(
        `Employee with code '${data.employeeCode}' already exists`,
        409,
        "CONFLICT"
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        name: data.name,
        email: data.email,
        phone: data.phone,
        department: data.department,
        designation: data.designation,
        joiningDate: new Date(data.joiningDate),
        status: data.status || "ACTIVE",
        bankAccountNumber: data.bankAccountNumber,
        bankName: data.bankName,
        userId: data.userId,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: "EMPLOYEE_CREATED",
      entityType: "Employee",
      entityId: employee.id,
      newData: employee,
      reason: "Initial employee creation",
    });

    return employee;
  }

  public static async updateEmployee(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string | null;
      department: string | null;
      designation: string | null;
      joiningDate: string;
      status: EmployeeStatus;
      bankAccountNumber: string | null;
      bankName: string | null;
      userId: string | null;
    }>,
    actorId?: string
  ) {
    const existing = await this.getEmployeeById(id);

    const updatePayload: any = { ...data };
    if (data.joiningDate) {
      updatePayload.joiningDate = new Date(data.joiningDate);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: updatePayload,
    });

    await AuditService.log({
      userId: actorId,
      action: "EMPLOYEE_UPDATED",
      entityType: "Employee",
      entityId: id,
      oldData: existing,
      newData: updated,
      reason: "Employee profile update",
    });

    return updated;
  }

  public static async archiveEmployee(id: string, actorId?: string) {
    const existing = await this.getEmployeeById(id);

    const updated = await prisma.employee.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });

    await AuditService.log({
      userId: actorId,
      action: "EMPLOYEE_ARCHIVED",
      entityType: "Employee",
      entityId: id,
      oldData: { status: existing.status },
      newData: { status: "ARCHIVED" },
      reason: "Employee archived",
    });

    return updated;
  }
}
