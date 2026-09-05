import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.js";
import { UserRole } from "../config/constants.js";

export function requireRole(...allowedRoles: UserRole[]) {
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

export default requireRole;
