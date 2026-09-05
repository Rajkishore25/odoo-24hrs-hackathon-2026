import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { AuthService } from "../services/authService.js";
import { authConfig } from "../config/auth.js";
import { db } from "../config/database.js";

describe("Phase 2 — Authentication & RBAC Engine", () => {
  describe("Password Hashing & Verification", () => {
    it("should hash a password and verify it correctly", async () => {
      const password = "mySecurePassword123";
      const hash = await AuthService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = await AuthService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await AuthService.verifyPassword("wrongPassword", hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe("POST /api/auth/login Validation", () => {
    it("should reject login request with missing fields", async () => {
      const res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "not-an-email", password: "password123" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Protected Endpoints & JWT Verification", () => {
    it("GET /api/auth/me should reject request without Bearer token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("GET /api/auth/me should reject expired or invalid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token-string");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("POST /api/auth/logout with valid token should succeed", async () => {
      const token = jwt.sign(
        { id: "mock-user-id", email: "user@test.com", role: "HR_MANAGER" },
        authConfig.jwtSecret,
        { expiresIn: "1h" }
      );

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Logout");
    });
  });

  describe("Leave Routes Integration (/api/leave)", () => {
    it("GET /api/leave/types should respond with standard API envelope", async () => {
      // Mock db response for findMany
      vi.spyOn(db.timeOffType, "findMany").mockResolvedValueOnce([
        {
          id: "type-1",
          name: "Annual Leave",
          isPaid: true,
          unit: "DAYS",
          isActive: true,
        },
      ] as any);

      const res = await request(app).get("/api/leave/types");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe("Annual Leave");
    });
  });
});
