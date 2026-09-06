import { Response } from 'express';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Recursively serializes Prisma response data:
 * - Decimal → number
 * - Date    → ISO string
 * This ensures JSON responses are always plain primitives, never Prisma wrapper types.
 */
function serializeData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Decimal) return Number(obj);
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeData);
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeData(value);
    }
    return result;
  }
  return obj;
}

export function successResponse(res: Response, data: unknown, message?: string, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data: serializeData(data),
    ...(message && { message }),
  });
}

export function errorResponse(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  });
}
