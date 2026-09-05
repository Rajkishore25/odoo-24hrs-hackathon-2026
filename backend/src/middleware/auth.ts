import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import { authConfig } from "../config/auth.js";
import { UserRole } from "../config/constants.js";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, "UNAUTHORIZED", "Authentication token missing or invalid", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as AuthUser;
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
    const decoded = jwt.verify(token, authConfig.jwtSecret) as AuthUser;
    req.user = decoded;
  } catch (err) {
    // Ignore invalid token in optionalAuth
  }
  return next();
}

export default authenticate;
