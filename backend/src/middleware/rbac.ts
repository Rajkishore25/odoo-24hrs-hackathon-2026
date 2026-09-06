import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export type Role =
  | 'SUPER_ADMIN'
  | 'HR_MANAGER'
  | 'PAYROLL_OFFICER'
  | 'LINE_MANAGER'
  | 'EMPLOYEE';

/**
 * Middleware factory — restricts the route to one or more roles.
 * Super Admin always passes.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userRole = req.user.role as Role;

    // Super admin bypasses all role restrictions
    if (userRole === 'SUPER_ADMIN') return next();

    if (!roles.includes(userRole)) {
      return next(
        new ForbiddenError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${userRole}`
        )
      );
    }

    next();
  };
}

/**
 * Utility — checks if the current user has a given role.
 */
export function hasRole(req: Request, ...roles: Role[]): boolean {
  if (!req.user) return false;
  const userRole = req.user.role as Role;
  if (userRole === 'SUPER_ADMIN') return true;
  return roles.includes(userRole);
}
