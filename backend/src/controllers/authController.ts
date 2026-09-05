import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/authService.js";
import { sendSuccess } from "../utils/response.js";

export class AuthController {
  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      return sendSuccess(res, result, "Login successful");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, null, "Logout successful");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await AuthService.getMe(req.user!.id);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
