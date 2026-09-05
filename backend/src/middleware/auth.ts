import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";

export interface AuthUser {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "HR_MANAGER" | "PAYROLL_OFFICER" | "LINE_MANAGER" | "EMPLOYEE";
  employeeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "peoplepay360-hackathon-jwt-secret-key";

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "UNAUTHORIZED", "Authentication token missing or invalid", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch (err: any) {
    return sendError(res, "UNAUTHORIZED", "Token is invalid or expired", 401);
  }
}

/**
 * Optional authentication: attaches req.user if a valid token is present, but does not reject if absent.
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
  } catch (err) {
    // Ignore invalid token in optionalAuth
  }
  return next();
}
