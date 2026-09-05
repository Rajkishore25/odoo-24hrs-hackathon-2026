import { Router } from "express";
import authRoutes from "./authRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import contractRoutes from "./contractRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import leaveRoutes from "./leaveRoutes.js";
import timeOffRoutes from "./timeOffRoutes.js";
import { AuditService } from "../services/auditService.js";
import { sendSuccess } from "../utils/response.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

// Health check endpoint
router.get("/health", (req, res) => {
  return sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() }, "PeoplePay360 Backend is healthy");
});

// Audit log endpoint
router.get("/audit", optionalAuth, async (req, res, next) => {
  try {
    const logs = await AuditService.getLogs(req.query as any);
    return sendSuccess(res, logs);
  } catch (error) {
    next(error);
  }
});

// Authentication & Core Services (Phase 2)
router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/contracts", contractRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leave", leaveRoutes);
router.use("/time-off", timeOffRoutes); // alias for backwards compatibility with API contract

export default router;
