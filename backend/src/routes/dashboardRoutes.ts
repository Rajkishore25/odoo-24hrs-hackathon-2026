import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", optionalAuth, DashboardController.getMetrics);

export default router;
