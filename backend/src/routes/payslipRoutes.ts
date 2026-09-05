import { Router } from "express";
import { PayslipController } from "../controllers/payslipController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();

router.get("/:id", optionalAuth, PayslipController.getPayslipById);
router.get("/:id/pdf", optionalAuth, PayslipController.getPayslipPdf);

export default router;
