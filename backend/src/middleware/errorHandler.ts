import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";
import { ZodError } from "zod";

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST", details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return sendError(res, err.code, err.message, err.statusCode, err.details);
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return sendError(res, "VALIDATION_ERROR", "Invalid input data", 400, details);
  }

  // Handle Prisma unique constraint or foreign key violations if needed
  if (err?.code === "P2002") {
    const fields = err.meta?.target || "field";
    return sendError(res, "CONFLICT", `Unique constraint failed on: ${fields}`, 409);
  }

  if (err?.code === "P2025") {
    return sendError(res, "NOT_FOUND", "Record not found", 404);
  }

  console.error("Unhandled server error:", err);
  return sendError(res, "INTERNAL_SERVER_ERROR", err?.message || "An unexpected error occurred", 500);
}
