import prisma from '../../config/prisma';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';

interface AuditLogInput {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: unknown;
  newData?: unknown;
  reason?: string;
}

/**
 * Record a sensitive action in the audit log.
 * Fire-and-forget safe — errors are caught and logged but do not bubble up.
 */
export async function auditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldData: input.oldData ? (input.oldData as object) : undefined,
        newData: input.newData ? (input.newData as object) : undefined,
        reason: input.reason,
      },
    });
  } catch (err) {
    // Audit failure must never break the main operation
    console.error('[AuditLog] Failed to write audit record:', err);
  }
}

export async function listAuditLogs(query: {
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
  page?: string;
  limit?: string;
}) {
  const { page, limit, skip } = parsePagination(query);

  const where: Record<string, unknown> = {};

  if (query.userId) where.userId = query.userId;
  if (query.action) where.action = { contains: query.action, mode: 'insensitive' };
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;

  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from && { gte: new Date(query.from) }),
      ...(query.to && { lte: new Date(query.to) }),
    };
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, pagination: buildPaginationMeta(total, page, limit) };
}
