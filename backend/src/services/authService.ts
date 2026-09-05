import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/database.js";
import { authConfig } from "../config/auth.js";
import { AuthUser } from "../middleware/auth.js";
import { LoginInput } from "../validations/authValidation.js";
import { AppError } from "../middleware/errorHandler.js";

export class AuthService {
  /**
   * Hashes a raw password using bcrypt.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, authConfig.saltRounds);
  }

  /**
   * Verifies a raw password against an existing hash.
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Authenticates a user by email/password and issues a JWT token.
   */
  static async login(input: LoginInput) {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            name: true,
            department: true,
            designation: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    if (!user.isActive) {
      throw new AppError("User account has been deactivated", 403, "ACCOUNT_INACTIVE");
    }

    const isMatch = await this.verifyPassword(input.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser["role"],
      employeeId: user.employee ? user.employee.id : null,
    };

    const accessToken = jwt.sign(payload, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn as any,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employee ? user.employee.id : null,
        employee: user.employee || null,
      },
    };
  }

  /**
   * Retrieves profile details for the currently authenticated user.
   */
  static async getMe(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            contracts: {
              where: { status: "ACTIVE" },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }

    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}

export default AuthService;
