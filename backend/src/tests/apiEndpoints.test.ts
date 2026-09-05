import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("API Infrastructure & Standard Response", () => {
  it("GET /api/health should return 200 with standard response wrapper", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe("ok");
    expect(res.body.message).toContain("healthy");
  });

  it("GET /api/non-existent-route should return 404 with structured error envelope", async () => {
    const res = await request(app).get("/api/non-existent-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("POST /api/employees without payload should fail Zod validation with 400", async () => {
    const res = await request(app).post("/api/employees").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});
