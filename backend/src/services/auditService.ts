import prisma from "../config/prisma.js";

export interface LogAuditParams {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  reason?: string;
}

export class AuditService {
  public static async log(params: LogAuditParams) {
    try {
      // If no userId is provided (e.g. system action or seed), find or use default system user if available
      let actorId = params.userId;
      if (!actorId) {
        const firstUser = await prisma.user.findFirst({ select: { id: true } });
        if (firstUser) {
          actorId = firstUser.id;
        }
      }

      if (!actorId) {
        // Cannot write audit log without a valid foreign key to User
        return null;
      }

      return await prisma.auditLog.create({
        data: {
          userId: actorId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldData: params.oldData ? JSON.parse(JSON.stringify(params.oldData)) : undefined,
          newData: params.newData ? JSON.parse(JSON.stringify(params.newData)) : undefined,
          reason: params.reason,
        },
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
      return null;
    }
  }

  public static async getLogs(filter: {
    entityType?: string;
    entityId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.action) where.action = filter.action;

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
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
}
