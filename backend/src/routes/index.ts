import { Router } from "express";
import authRoutes from "./authRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import contractRoutes from "./contractRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import leaveRoutes from "./leaveRoutes.js";
import timeOffRoutes from "./timeOffRoutes.js";
import salaryRoutes from "./salaryRoutes.js";
import payrunRoutes from "./payrunRoutes.js";
import payslipRoutes from "./payslipRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
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

// Phase 1 & 2: HR Domain & Authentication
router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/contracts", contractRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leave", leaveRoutes);
router.use("/time-off", timeOffRoutes);

// Phase 3: Payroll Engine, Validation Cockpit, Payruns & Dashboard
router.use("/", salaryRoutes); // /salary-structures & /salary-rules
router.use("/payruns", payrunRoutes);
router.use("/payslips", payslipRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
