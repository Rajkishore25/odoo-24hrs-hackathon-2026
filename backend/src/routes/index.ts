import { Router } from "express";
import employeeRoutes from "./employeeRoutes.js";
import contractRoutes from "./contractRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
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

// Domain Routes
router.use("/employees", employeeRoutes);
router.use("/contracts", contractRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/time-off", timeOffRoutes);

export default router;
