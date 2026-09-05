import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";
import { AuthUser } from "./auth.js";

type AllowedRole = AuthUser["role"];

export function requireRole(...allowedRoles: AllowedRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, "UNAUTHORIZED", "User not authenticated", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        "FORBIDDEN",
        `Access denied. Role '${req.user.role}' does not have required permissions.`,
        403
      );
    }

    next();
  };
}
